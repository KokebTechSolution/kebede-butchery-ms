# Generated manually to add unit_type field to OrderItem

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='unit_type',
            field=models.CharField(
                choices=[
                    ('carton', 'Carton'),
                    ('bottle', 'Bottle'),
                    ('litre', 'Litre'),
                    ('unit', 'Unit'),
                    ('shot', 'Shot'),
                ],
                default='unit',
                max_length=20
            ),
        ),
    ] 