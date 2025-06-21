from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from .serializers import UserLoginSerializer

class UserListView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserLoginSerializer(users, many=True)
        return Response(serializer.data)