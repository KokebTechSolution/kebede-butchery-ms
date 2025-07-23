# inventory/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product, AuditLog
from django.contrib.contenttypes.models import ContentType

@receiver(post_save, sender=Product)
def track_product_update(sender, instance, created, **kwargs):
    action = 'create' if created else 'update'
    AuditLog.objects.create(
        user=None,  # Set to the user if available
        action=action,
        object_id=instance.pk,
        content_type=ContentType.objects.get_for_model(instance),
        details={'product_name': instance.name},
        notes=f"Product {action}d via system auto-log",
    )
