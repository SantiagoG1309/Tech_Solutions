from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ticket, Comment, TicketHistory

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'department', 'phone', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'user', 'user_name', 'content', 'created_at']
        read_only_fields = ['user']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TicketHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketHistory
        fields = ['id', 'ticket', 'user', 'user_name', 'action', 'timestamp']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

class TicketSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    history = TicketHistorySerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name', 'category', 'category_display',
            'priority', 'priority_display', 'status', 'status_display',
            'created_at', 'updated_at', 'resolved_at', 'comments', 'history'
        ]
        read_only_fields = ['created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_priority_display(self, obj):
        return obj.get_priority_display()
    
    def get_category_display(self, obj):
        return obj.get_category_display()
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        ticket = super().create(validated_data)
        
        # Create history entry
        TicketHistory.objects.create(
            ticket=ticket,
            user=self.context['request'].user,
            action="Ticket created"
        )
        
        return ticket
    
    def update(self, instance, validated_data):
        # Track changes for history
        changes = []
        for attr, value in validated_data.items():
            old_value = getattr(instance, attr)
            if old_value != value:
                if attr == 'status':
                    changes.append(f"Status changed from {instance.get_status_display()} to {dict(Ticket.STATUS_CHOICES).get(value)}")
                elif attr == 'priority':
                    changes.append(f"Priority changed from {instance.get_priority_display()} to {dict(Ticket.PRIORITY_CHOICES).get(value)}")
                elif attr == 'assigned_to':
                    old_name = f"{old_value.first_name} {old_value.last_name}" if old_value else "Unassigned"
                    new_name = f"{value.first_name} {value.last_name}" if value else "Unassigned"
                    changes.append(f"Assignment changed from {old_name} to {new_name}")
                else:
                    changes.append(f"{attr.replace('_', ' ').title()} updated")
        
        # Update the ticket
        ticket = super().update(instance, validated_data)
        
        # Create history entries for each change
        for change in changes:
            TicketHistory.objects.create(
                ticket=ticket,
                user=self.context['request'].user,
                action=change
            )
        
        return ticket

class DashboardStatsSerializer(serializers.Serializer):
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    in_progress_tickets = serializers.IntegerField()
    resolved_tickets = serializers.IntegerField()
    closed_tickets = serializers.IntegerField()
    avg_resolution_time = serializers.FloatField()
    tickets_by_category = serializers.DictField()
    tickets_by_priority = serializers.DictField()

