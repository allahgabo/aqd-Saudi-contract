from django.urls import path
from .views import (
    ContractUploadView, ContractListView, ContractDetailView,
    ContractDeleteView, ContractStatsView, ContractShareView,
    SharedContractView, ContractChatView, ContractCompareView,
)

urlpatterns = [
    path('upload/',              ContractUploadView.as_view(),   name='contract-upload'),
    path('',                     ContractListView.as_view(),     name='contract-list'),
    path('stats/',               ContractStatsView.as_view(),    name='contract-stats'),
    path('compare/',             ContractCompareView.as_view(),  name='contract-compare'),
    path('<uuid:id>/',           ContractDetailView.as_view(),   name='contract-detail'),
    path('<uuid:id>/delete/',    ContractDeleteView.as_view(),   name='contract-delete'),
    path('<uuid:id>/chat/',      ContractChatView.as_view(),     name='contract-chat'),
    path('<uuid:id>/share/',     ContractShareView.as_view(),    name='contract-share'),
    path('shared/<uuid:token>/', SharedContractView.as_view(),   name='contract-shared'),
]
