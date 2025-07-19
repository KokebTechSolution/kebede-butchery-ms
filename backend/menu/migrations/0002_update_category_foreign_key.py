# Generated manually to fix foreign key constraint

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_initial'),
        ('menu', '0001_initial'),
    ]

    operations = [
        # Remove the old foreign key constraint
        migrations.AlterField(
            model_name='menuitem',
            name='category',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='inventory.category',
                verbose_name='Category'
            ),
        ),
    ]
