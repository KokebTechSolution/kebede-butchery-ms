from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from branches.models import Branch

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for the application'

    def handle(self, *args, **options):
        # Create a default branch if none exists
        branch, created = Branch.objects.get_or_create(
            name='Main Branch',
            defaults={
                'location': 'Main Location',
                'phone': '123-456-7890'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created Main Branch'))

        # Create superuser/owner
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@kebedebutchery.com',
                password='admin123',
                role='owner',
                branch=branch
            )
            self.stdout.write(self.style.SUCCESS('✅ Created admin user (username: admin, password: admin123)'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists'))

        # Create test waiter
        if not User.objects.filter(username='waiter1').exists():
            waiter_user = User.objects.create_user(
                username='waiter1',
                email='waiter1@kebedebutchery.com',
                password='waiter123',
                role='waiter',
                branch=branch
            )
            self.stdout.write(self.style.SUCCESS('✅ Created waiter1 user (username: waiter1, password: waiter123)'))
        else:
            self.stdout.write(self.style.WARNING('Waiter1 user already exists'))

        # Create test manager
        if not User.objects.filter(username='manager1').exists():
            manager_user = User.objects.create_user(
                username='manager1',
                email='manager1@kebedebutchery.com',
                password='manager123',
                role='manager',
                branch=branch
            )
            self.stdout.write(self.style.SUCCESS('✅ Created manager1 user (username: manager1, password: manager123)'))
        else:
            self.stdout.write(self.style.WARNING('Manager1 user already exists'))

        self.stdout.write(self.style.SUCCESS('\n🎉 User creation process completed!'))
        self.stdout.write(self.style.SUCCESS('You can now log in with:'))
        self.stdout.write(self.style.SUCCESS('  - admin/admin123 (Owner)'))
        self.stdout.write(self.style.SUCCESS('  - waiter1/waiter123 (Waiter)'))
        self.stdout.write(self.style.SUCCESS('  - manager1/manager123 (Manager)'))
