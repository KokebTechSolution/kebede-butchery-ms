
from rest_framework import serializers
from .models import Branch

from rest_framework import serializers
from .models import Table


class BranchSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'name',
            'location',
            'city',
            'subcity',
            'wereda',
        ]

    def get_display_name(self, obj):
        return f"{obj.name} - {obj.city}, {obj.subcity}, {obj.wereda}"

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = '__all__' 
