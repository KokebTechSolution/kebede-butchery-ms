# inventory/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product, AuditLog

@receiver(post_save, sender=Product)
def track_product_update(sender, instance, created, **kwargs):
    action = 'create' if created else 'update'
    AuditLog.objects.create(
        action=action,
        notes=f"Product {action}d via system auto-log",
        content_object=instance,
        # Optionally, set user=kwargs.get('user') if available
    )
