from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Create a superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username="kebede_pos").exists():
            User.objects.create_superuser(
                username="kebede_pos",
                email="admin@example.com",
                password="12345"
            )
            self.stdout.write(self.style.SUCCESS('Superuser "kebede_pos" created with password "12345".'))
        else:
            self.stdout.write(self.style.WARNING('Superuser "kebede_pos" already exists.'))
