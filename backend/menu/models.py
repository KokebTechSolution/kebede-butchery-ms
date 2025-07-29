# menu/models.py

from django.db import models
from inventory.models import Product, Stock  

class MenuCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Menu(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    items = models.ManyToManyField('MenuItem', related_name='menus', blank=True)

    def __str__(self):
        return self.name


class MenuSection(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.menu.name}"


class MenuItem(models.Model):
    FOOD = 'food'
    BEVERAGE = 'beverage'

    ITEM_TYPE_CHOICES = [
        (FOOD, 'Food'),
        (BEVERAGE, 'Beverage'),
    ]

    name = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    item_type = models.CharField(max_length=50, choices=ITEM_TYPE_CHOICES)
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE)
    is_available = models.BooleanField(default=True)
<<<<<<< HEAD
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE, null=True, blank=True)
=======
    product = models.ForeignKey('inventory.Product', on_delete=models.SET_NULL, null=True, blank=True)
>>>>>>> 93538555aea552d247ce892fe0eaffe5c45d9d56

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or "Unnamed Item"

    def get_stock_for_branch(self, branch_id):
        """
        Returns the Stock object for this menu item's linked product in the given branch.
        Returns None if not found.
        """
        if not self.product:
            return None
        return self.product.stock_set.filter(branch_id=branch_id).first()

    def is_running_out(self, branch_id):
        """
        Returns True if the linked stock is marked as running out for the given branch.
        """
        stock = self.get_stock_for_branch(branch_id)
        return stock.running_out if stock else False

    def available_quantity_summary(self, branch_id):
        """
        Returns a dict with available quantities (cartons, bottles, units) for the given branch.
        """
        stock = self.get_stock_for_branch(branch_id)
        if stock:
            return {
                "cartons": stock.carton_quantity,
                "bottles": stock.bottle_quantity,
                "units": stock.unit_quantity,
            }
        return None
