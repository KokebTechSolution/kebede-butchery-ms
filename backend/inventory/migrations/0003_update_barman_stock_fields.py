# Generated manually to update BarmanStock fields

from django.db import migrations, models

def forward_func(apps, schema_editor):
    # Get the BarmanStock model
    BarmanStock = apps.get_model('inventory', 'BarmanStock')
    
    # Add new fields to existing records
    for barman_stock in BarmanStock.objects.all():
        # Set default values for new fields
        barman_stock.carton_quantity = 0.00
        barman_stock.bottle_quantity = 0.00
        barman_stock.litre_quantity = 0.00
        barman_stock.unit_quantity = 0.00
        barman_stock.shot_quantity = 0.00
        barman_stock.save()

def reverse_func(apps, schema_editor):
    # This is the reverse migration
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_initial'),
    ]

    operations = [
        # Add new unit-specific quantity fields
        migrations.AddField(
            model_name='barmanstock',
            name='carton_quantity',
            field=models.DecimalField(max_digits=10, decimal_places=2, default=0.00),
        ),
        migrations.AddField(
            model_name='barmanstock',
            name='bottle_quantity',
            field=models.DecimalField(max_digits=10, decimal_places=2, default=0.00),
        ),
        migrations.AddField(
            model_name='barmanstock',
            name='litre_quantity',
            field=models.DecimalField(max_digits=10, decimal_places=2, default=0.00),
        ),
        migrations.AddField(
            model_name='barmanstock',
            name='unit_quantity',
            field=models.DecimalField(max_digits=10, decimal_places=2, default=0.00),
        ),
        migrations.AddField(
            model_name='barmanstock',
            name='shot_quantity',
            field=models.DecimalField(max_digits=10, decimal_places=2, default=0.00),
        ),
        
        # Update unique constraint first (remove unit_type from it)
        migrations.AlterUniqueTogether(
            name='barmanstock',
            unique_together={('stock', 'bartender')},
        ),
        
        # Run the data migration
        migrations.RunPython(forward_func, reverse_func),
        
        # Remove old fields (these might not exist if the model was already updated)
        migrations.RemoveField(
            model_name='barmanstock',
            name='unit_type',
        ),
        migrations.RemoveField(
            model_name='barmanstock',
            name='quantity',
        ),
    ] 