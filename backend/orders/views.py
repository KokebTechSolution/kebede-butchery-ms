from django.shortcuts import render

from django.http import JsonResponse
from users.decorators import group_required

@group_required('Waiter')
def create_order(request):
    return JsonResponse({'message': 'Order created by waiter'})
