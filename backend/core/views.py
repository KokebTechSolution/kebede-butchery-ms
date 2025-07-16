from django.shortcuts import render
from django.views.generic import TemplateView

from django.shortcuts import render

def index(request):
    return render(request, "index.html")
