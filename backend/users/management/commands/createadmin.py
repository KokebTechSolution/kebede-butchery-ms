"""from django.contrib.auth import get_user_model
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
"""


from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.timezone import make_aware
from datetime import datetime
from branches.models import Branch

User = get_user_model()

class Command(BaseCommand):
    help = "Seed the database with two branches and user accounts"

    def handle(self, *args, **options):
        # Create branches
        branches = {
            1: {"name": "Main Branch", "location": "HQ"},
            2: {"name": "Second Branch", "location": "Downtown"},
        }

        for branch_id, data in branches.items():
            branch, created = Branch.objects.get_or_create(
                id=branch_id,
                defaults=data
            )
            msg = f"Branch '{data['name']}' {'created' if created else 'already exists'}."
            self.stdout.write(self.style.SUCCESS(msg))

        allowed_roles = {"waiter", "bartender", "meat", "cashier", "manager", "owner"}

        users_data = [
            {"username": "waiter_user1", "first_name": "Ali", "last_name": "Waiter", "role": "waiter"},
            {"username": "bartender_user1", "first_name": "Beka", "last_name": "Bartender", "role": "bartender"},
            {"username": "store_user1", "first_name": "Sami", "last_name": "Store", "role": "meat"},
            {"username": "cashier_user1", "first_name": "Mahi", "last_name": "Cashier", "role": "cashier"},
            {"username": "inventory_user1", "first_name": "Hana", "last_name": "Inventory", "role": "manager"},
            {"username": "kitchen_user1", "first_name": "Fira", "last_name": "Kitchen", "role": "meat"},
            {"username": "account_user1", "first_name": "Lomi", "last_name": "Account", "role": "owner"},
            {"username": "admin_user1", "first_name": "Zaki", "last_name": "Admin", "role": "owner"},
            {"username": "waiter_user2", "first_name": "Sara", "last_name": "Waiter", "role": "waiter"},
            {"username": "bartender_user2", "first_name": "Jonas", "last_name": "Bartender", "role": "bartender"},
            {"username": "store_user2", "first_name": "Saba", "last_name": "Store", "role": "meat"},
            {"username": "cashier_user2", "first_name": "Ruth", "last_name": "Cashier", "role": "cashier"},
        ]

        shared_data = {
            "email_domain": "@example.com",
            "password": "pbkdf2_sha256$1000000$7B9ppvo9Kf4Xbbr4Qv0IzY$1NFo2aqLdblHRGKTbbv62S1HHwtJCkJ/sCll2YoNoms=",
            "date_joined": make_aware(datetime(2025, 7, 29, 0, 9, 43)),
            "updated_at": make_aware(datetime(2025, 7, 29, 0, 9, 43)),
        }

        for idx, data in enumerate(users_data, start=1):
            role = data["role"]
            if role not in allowed_roles:
                self.stdout.write(self.style.WARNING(f"Skipped user '{data['username']}' due to invalid role '{role}'"))
                continue

            branch_id = 1 if idx <= 6 else 2
            branch = Branch.objects.get(id=branch_id)

            user, created = User.objects.update_or_create(
                username=data["username"],
                defaults={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "email": data["username"] + shared_data["email_domain"],
                    "password": shared_data["password"],
                    "phone_number": f"09{idx:08}",
                    "role": role,
                    "branch": branch,
                    "is_staff": True,
                    "is_active": True,
                    "date_joined": shared_data["date_joined"],
                    "updated_at": shared_data["updated_at"],
                }
            )
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} user: {user.username} in Branch {branch_id}"))
