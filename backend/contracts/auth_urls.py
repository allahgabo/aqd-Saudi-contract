from django.urls import path
from .auth_views import (
    RegisterView, ProfileView, LogoutView,
    CustomTokenObtainPairView, UpgradePlanView, ChangePasswordView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('token/',           CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/',   TokenRefreshView.as_view(),          name='token_refresh'),
    path('register/',        RegisterView.as_view(),              name='register'),
    path('profile/',         ProfileView.as_view(),               name='profile'),
    path('logout/',          LogoutView.as_view(),                name='logout'),
    path('upgrade/',         UpgradePlanView.as_view(),           name='upgrade_plan'),
    path('change-password/', ChangePasswordView.as_view(),        name='change_password'),
]
