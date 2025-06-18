from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response

class ItemListView(APIView):
    def get(self, request):

        data = {'message': 'List of inventory items'}
        return Response(data)
