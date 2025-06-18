from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', 'last_migration_name_here'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='phone',
            field=models.CharField(max_length=20, blank=True),
        ),
    ]
