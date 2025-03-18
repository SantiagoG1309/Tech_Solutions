from django.db.models import Count, Avg, F, ExpressionWrapper, fields
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from datetime import timedelta

from .models import Ticket, Comment, TicketHistory
from .serializers import (
    UserSerializer, TicketSerializer, CommentSerializer,
    TicketHistorySerializer, DashboardStatsSerializer
)
from .permissions import IsAdminOrDirector, IsAdminOrDirectorOrReadOnly, IsTicketOwnerOrStaff

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            # Allow anyone to register as a client
            return [permissions.AllowAny()]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            # Only admin or director can manage users
            return [IsAdminOrDirector()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        # If not admin/director, only allow client registration
        if not request.user.is_authenticated or request.user.user_type not in ['admin', 'director']:
            request.data['user_type'] = 'client'
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrDirector()])
    def employees(self, request):
        employees = User.objects.filter(user_type='employee')
        serializer = self.get_serializer(employees, many=True)
        return Response(serializer.data)

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsTicketOwnerOrStaff]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin and director can see all tickets
        if user.user_type in ['admin', 'director']:
            return Ticket.objects.all()
        
        # Employees can see tickets assigned to them
        if user.user_type == 'employee':
            return Ticket.objects.filter(assigned_to=user)
        
        # Clients can only see their own tickets
        return Ticket.objects.filter(created_by=user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        
        if request.user.user_type not in ['admin', 'director']:
            return Response(
                {"detail": "Only administrators and directors can assign tickets."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        employee_id = request.data.get('employee_id')
        try:
            employee = User.objects.get(id=employee_id, user_type='employee')
        except User.DoesNotExist:
            return Response(
                {"detail": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ticket.assigned_to = employee
        ticket.save()
        
        # Create history entry
        TicketHistory.objects.create(
            ticket=ticket,
            user=request.user,
            action=f"Assigned to {employee.first_name} {employee.last_name}"
        )
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        ticket = self.get_object()
        
        # Validate that the user has permission to change status
        if request.user.user_type == 'client' and request.user != ticket.created_by:
            return Response(
                {"detail": "You don't have permission to change this ticket's status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(Ticket.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = ticket.status
        ticket.status = new_status
        ticket.save()
        
        # Create history entry
        TicketHistory.objects.create(
            ticket=ticket,
            user=request.user,
            action=f"Status changed from {dict(Ticket.STATUS_CHOICES).get(old_status)} to {dict(Ticket.STATUS_CHOICES).get(new_status)}"
        )
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.filter(ticket_id=self.kwargs.get('ticket_pk'))
    
    def create(self, request, *args, **kwargs):
        request.data['ticket'] = self.kwargs.get('ticket_pk')
        return super().create(request, *args, **kwargs)

class DashboardStatsView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardStatsSerializer
    
    def get_object(self):
        user = self.request.user
        
        # Base queryset depends on user role
        if user.user_type in ['admin', 'director']:
            queryset = Ticket.objects.all()
        elif user.user_type == 'employee':
            queryset = Ticket.objects.filter(assigned_to=user)
        else:  # client
            queryset = Ticket.objects.filter(created_by=user)
        
        # Calculate statistics
        total_tickets = queryset.count()
        open_tickets = queryset.filter(status='open').count()
        in_progress_tickets = queryset.filter(status='in_progress').count()
        resolved_tickets = queryset.filter(status='resolved').count()
        closed_tickets = queryset.filter(status='closed').count()
        
        # Calculate average resolution time for resolved tickets
        resolved_tickets_with_time = queryset.filter(
            status__in=['resolved', 'closed'],
            resolved_at__isnull=False
        )
        
        if resolved_tickets_with_time.exists():
            # Calculate the difference in hours
            resolution_times = resolved_tickets_with_time.annotate(
                resolution_time=ExpressionWrapper(
                    F('resolved_at') - F('created_at'),
                    output_field=fields.DurationField()
                )
            )
            
            total_hours = sum(
                (rt.resolution_time.total_seconds() / 3600) 
                for rt in resolution_times
            )
            avg_resolution_time = total_hours / resolved_tickets_with_time.count()
        else:
            avg_resolution_time = 0
        
        # Tickets by category
        tickets_by_category = dict(
            queryset.values_list('category').annotate(count=Count('id')).order_by()
        )
        
        # Tickets by priority
        tickets_by_priority = dict(
            queryset.values_list('priority').annotate(count=Count('id')).order_by()
        )
        
        return {
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'in_progress_tickets': in_progress_tickets,
            'resolved_tickets': resolved_tickets,
            'closed_tickets': closed_tickets,
            'avg_resolution_time': round(avg_resolution_time, 2),
            'tickets_by_category': tickets_by_category,
            'tickets_by_priority': tickets_by_priority
        }

