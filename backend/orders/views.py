from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from rest_framework.views import APIView
from rest_framework.response import Response

class OrderListView(APIView):
    def get(self, request):
        return Response({"message": "Order list placeholder"})
