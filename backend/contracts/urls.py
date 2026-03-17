from django.urls import path
from .views import *

urlpatterns = [
    path('upload/',                     ContractUploadView.as_view(),    name='contract-upload'),
    path('',                            ContractListView.as_view(),      name='contract-list'),
    path('stats/',                      ContractStatsView.as_view(),     name='contract-stats'),
    path('compare/',                    ContractCompareView.as_view(),   name='contract-compare'),
    path('<uuid:id>/',                  ContractDetailView.as_view(),    name='contract-detail'),
    path('<uuid:id>/delete/',           ContractDeleteView.as_view(),    name='contract-delete'),
    path('<uuid:id>/chat/',             ContractChatView.as_view(),      name='contract-chat'),
    path('<uuid:id>/share/',            ContractShareView.as_view(),     name='contract-share'),
    path('shared/<uuid:token>/',        SharedContractView.as_view(),    name='contract-shared'),
    path('admin/users/',                AdminUsersView.as_view(),        name='admin-users'),
    path('admin/users/<int:user_id>/',  AdminUserDetailView.as_view(),   name='admin-user-detail'),
    path('admin/stats/',                AdminStatsView.as_view(),        name='admin-stats'),
]
