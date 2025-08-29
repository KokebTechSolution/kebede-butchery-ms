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
                'city': 'Addis Ababa',
                'subcity': 'Bole',
                'wereda': '03'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created Main Branch'))

        # Create users for all roles
        users_to_create = [
            {
                'username': 'admin',
                'email': 'admin@kebedebutchery.com',
                'password': 'admin123',
                'role': 'owner',
                'is_superuser': True,
                'description': 'Owner/Admin'
            },
            {
                'username': 'waiter1',
                'email': 'waiter1@kebedebutchery.com',
                'password': 'waiter123',
                'role': 'waiter',
                'is_superuser': False,
                'description': 'Waiter'
            },
            {
                'username': 'bartender1',
                'email': 'bartender1@kebedebutchery.com',
                'password': 'bartender123',
                'role': 'bartender',
                'is_superuser': False,
                'description': 'Bartender'
            },
            {
                'username': 'meat1',
                'email': 'meat1@kebedebutchery.com',
                'password': 'meat123',
                'role': 'meat',
                'is_superuser': False,
                'description': 'Meat Counter'
            },
            {
                'username': 'cashier1',
                'email': 'cashier1@kebedebutchery.com',
                'password': 'cashier123',
                'role': 'cashier',
                'is_superuser': False,
                'description': 'Cashier'
            },
            {
                'username': 'manager1',
                'email': 'manager1@kebedebutchery.com',
                'password': 'manager123',
                'role': 'manager',
                'is_superuser': False,
                'description': 'Branch Manager'
            }
        ]

        # Create each user
        for user_data in users_to_create:
            if not User.objects.filter(username=user_data['username']).exists():
                if user_data['is_superuser']:
                    user = User.objects.create_superuser(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password'],
                        role=user_data['role'],
                        branch=branch
                    )
                else:
                    user = User.objects.create_user(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password'],
                        role=user_data['role'],
                        branch=branch
                    )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Created {user_data["description"]} user (username: {user_data["username"]}, password: {user_data["password"]})'
                    )
                )
            else:
                self.stdout.write(self.style.WARNING(f'{user_data["description"]} user already exists'))

        self.stdout.write(self.style.SUCCESS('\n🎉 User creation process completed!'))
        self.stdout.write(self.style.SUCCESS('🔐 Test User Accounts Created:'))
        self.stdout.write(self.style.SUCCESS('  - admin/admin123 (Owner/Admin)'))
        self.stdout.write(self.style.SUCCESS('  - waiter1/waiter123 (Waiter)'))
        self.stdout.write(self.style.SUCCESS('  - bartender1/bartender123 (Bartender)'))
        self.stdout.write(self.style.SUCCESS('  - meat1/meat123 (Meat Counter)'))
        self.stdout.write(self.style.SUCCESS('  - cashier1/cashier123 (Cashier)'))
        self.stdout.write(self.style.SUCCESS('  - manager1/manager123 (Branch Manager)'))
