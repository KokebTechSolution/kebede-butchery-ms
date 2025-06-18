from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny  # ✅

from users.permissions import IsManager  # ✅ custom
# or just use AllowAny for public

class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        return Response({"message": "Report generated successfully!"})
