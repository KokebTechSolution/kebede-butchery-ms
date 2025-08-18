
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Branch(models.Model):
    name = models.CharField(max_length=100) 
    city = models.CharField(max_length=100, null=True, blank=True)
    subcity = models.CharField(max_length=100, null=True, blank=True)
    wereda = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        parts = [self.name]
        if self.city:
            parts.append(self.city)
        if self.subcity:
            parts.append(self.subcity)
        if self.wereda:
            parts.append(self.wereda)
        return " - ".join(parts)

    @property
    def display_name(self):
        return f"{self.name} - {self.location}"

class Table(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('ordering', 'Ordering'),
        ('ready_to_pay', 'Ready to Pay'),
        ('cleaning', 'Cleaning'),
        ('reserved', 'Reserved'),
    ]
    
    number = models.PositiveIntegerField()
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tables')
    seats = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tables'
    )
    current_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_table'
    )
    last_status_update = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('number', 'branch')

    def __str__(self):
        return f"Table {self.number} - {self.branch.name}"
    
    def can_accept_order(self):
        """
        Check if this table can accept new orders.
        Returns a tuple: (can_accept, reason)
        """
        # Check if table is in a state that allows new orders
        if self.status in ['cleaning', 'reserved']:
            return False, f"Table is currently {self.status}"
        
        # Check if table has active orders that would prevent new orders
        from orders.models import Order
        active_orders = Order.objects.filter(
            table=self,
            cashier_status__in=['pending', 'preparing', 'completed']
        ).exclude(
            food_status__in=['cancelled', 'rejected'],
            beverage_status__in=['cancelled', 'rejected']
        )
        
        if active_orders.exists():
            latest_order = active_orders.latest('created_at')
            if latest_order.cashier_status == 'printed':
                # If order is printed, table can accept new orders
                return True, "Table has printed order - ready for new orders"
            else:
                # If order is still active, table cannot accept new orders
                return False, f"Table has active order #{latest_order.order_number}"
        
        # No active orders, table can accept new orders
        return True, "Table is available for new orders"
    
    def update_status_from_order(self, order):
        """
        Update table status based on order status.
        This method is called when orders are created, updated, or completed.
        """
        from orders.models import Order
        
        # Get all active orders for this table
        active_orders = Order.objects.filter(
            table=self,
            cashier_status__in=['pending', 'preparing', 'completed']
        ).exclude(
            food_status__in=['cancelled', 'rejected'],
            beverage_status__in=['cancelled', 'rejected']
        )
        
        if not active_orders.exists():
            # No active orders, table is available
            self.status = 'available'
        else:
            latest_order = active_orders.latest('created_at')
            if latest_order.cashier_status == 'printed':
                # Order printed, table ready for new orders
                self.status = 'available'
            else:
                # Order active, table is ordering
                self.status = 'ordering'
        
        self.save()
        print(f"[DEBUG] Table {self.number} status updated to: {self.status}")



    def clean(self):
        """Validate table constraints"""
        if self.number <= 0:
            raise ValidationError("Table number must be positive")
        
        # Check for duplicate table numbers within the same branch
        if Table.objects.filter(branch=self.branch, number=self.number).exclude(id=self.id).exists():
            raise ValidationError(f"Table number {self.number} already exists in this branch")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

