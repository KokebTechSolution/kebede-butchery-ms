# products/models.py

from django.db import models

class ItemType(models.Model):
    type_name = models.CharField(max_length=50)
    category = models.CharField(max_length=20)

    class Meta:
        db_table = 'item_type'


    def __str__(self):
        return self.type_name


class Product(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20)
    type = models.ForeignKey(ItemType, on_delete=models.DO_NOTHING, db_column='type_id')
    unit = models.CharField(max_length=20)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    branch_id = models.IntegerField()
    is_active = models.BooleanField(default=True)
    # models.py
    created_at = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField()

    class Meta:
        db_table = 'product'


    def __str__(self):
        return self.name
