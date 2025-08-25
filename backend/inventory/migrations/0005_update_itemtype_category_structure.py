# Generated manually to update ItemType and Category structure

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0004_remove_product_receipt_image_and_more'),
    ]

    operations = [
        # Update ItemType model
        migrations.AlterField(
            model_name='itemtype',
            name='type_name',
            field=models.CharField(
                choices=[('food', 'Food'), ('beverage', 'Beverage')],
                max_length=50,
                unique=True
            ),
        ),
        migrations.AddField(
            model_name='itemtype',
            name='description',
            field=models.TextField(blank=True, help_text='Description of this item type', null=True),
        ),
        
        # Update Category model
        migrations.AddField(
            model_name='category',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Is this category currently available?'),
        ),
        migrations.AddField(
            model_name='category',
            name='sort_order',
            field=models.PositiveIntegerField(default=0, help_text='Order for display purposes'),
        ),
        
        # Create initial Food and Beverage item types
        migrations.RunPython(
            # Forward function
            lambda apps, schema_editor: apps.get_model('inventory', 'ItemType').objects.get_or_create(
                type_name='food',
                defaults={
                    'description': 'Food items including meat, vegetables, and prepared dishes',
                    'created_at': django.utils.timezone.now(),
                    'updated_at': django.utils.timezone.now()
                }
            ),
            # Reverse function
            lambda apps, schema_editor: apps.get_model('inventory', 'ItemType').objects.filter(
                type_name='food'
            ).delete()
        ),
        migrations.RunPython(
            # Forward function
            lambda apps, schema_editor: apps.get_model('inventory', 'ItemType').objects.get_or_create(
                type_name='beverage',
                defaults={
                    'description': 'Beverage items including alcoholic and non-alcoholic drinks',
                    'created_at': django.utils.timezone.now(),
                    'updated_at': django.utils.timezone.now()
                }
            ),
            # Reverse function
            lambda apps, schema_editor: apps.get_model('inventory', 'ItemType').objects.filter(
                type_name='beverage'
            ).delete()
        ),
    ]
