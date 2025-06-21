# payments/views.py
from django.http import JsonResponse

def transaction_list_view(request):
    return JsonResponse({"message": "Payments endpoint ready."})
