from django.shortcuts import render
from .models import InventoryItem, InventoryRequest

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets
from .models import InventoryItem, InventoryRequest
from .serializers import InventoryItemSerializer, ItemRequestSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

class InventoryRequest(viewsets.ModelViewSet):
    queryset = InventoryRequest.objects.all()
    serializer_class = ItemRequestSerializer

