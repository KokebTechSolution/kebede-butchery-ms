<<<<<<< HEAD
# inventory/serializers.py

from rest_framework import serializers
from .models import Branch

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']
=======
from rest_framework import serializers
from .models import Table

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = '__all__' 
>>>>>>> b8091a2069fb7237cfe0af3fe8ea54b747de83f7
