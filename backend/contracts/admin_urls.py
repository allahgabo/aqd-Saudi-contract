from django.urls import path
from .views import AdminUsersView, AdminUserPlanView, AdminStatsView

urlpatterns = [
    path('users/',              AdminUsersView.as_view(),           name='admin-users'),
    path('users/<int:user_id>/plan/', AdminUserPlanView.as_view(), name='admin-user-plan'),
    path('stats/',              AdminStatsView.as_view(),           name='admin-stats'),
]
