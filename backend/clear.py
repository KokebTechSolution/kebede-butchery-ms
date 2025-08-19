import os

# List of your local apps
apps = [
    "users",
    "products",
    "orders",
    "inventory",
    "payments",
    "branches",
    "activity",
    "menu",
    "reports",
    "core",
    "api"
]

for app in apps:
    migrations_dir = os.path.join(app, "migrations")
    if os.path.exists(migrations_dir):
        for filename in os.listdir(migrations_dir):
            if filename != "__init__.py" and filename.endswith(".py"):
                file_path = os.path.join(migrations_dir, filename)
                os.remove(file_path)
                print(f"Deleted {file_path}")
    else:
        print(f"No migrations folder for {app}")
