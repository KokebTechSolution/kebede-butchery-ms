

from django.db import migrations, connection

def fix_user_sequence(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT setval(pg_get_serial_sequence('"users_user"', 'id'),
                          (SELECT MAX(id) FROM "users_user"));
        """)

class Migration(migrations.Migration):


    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(fix_user_sequence),
    ]