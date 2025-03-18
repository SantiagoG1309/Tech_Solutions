from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_nested import routers

from .views import UserViewSet, TicketViewSet, CommentViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tickets', TicketViewSet, basename='ticket')

# Nested routes for comments
tickets_router = routers.NestedSimpleRouter(router, r'tickets', lookup='ticket')
tickets_router.register(r'comments', CommentViewSet, basename='ticket-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tickets_router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]

