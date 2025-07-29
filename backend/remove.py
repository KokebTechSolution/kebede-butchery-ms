import os
import glob

apps = ['users', 'branches', 'orders', 'inventory', 'menu', 'payments', 'reciepts', 'reports', 'core', 'owners', 'table']

for app in apps:
    migration_path = f'./{app}/migrations/'
    if os.path.exists(migration_path):
        files = glob.glob(migration_path + '*.py')
        for file in files:
            if not file.endswith('__init__.py'):
                os.remove(file)
        pyc_files = glob.glob(migration_path + '__pycache__/*.pyc')
        for file in pyc_files:
            os.remove(file)
print("Done cleaning migrations.")
