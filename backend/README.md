# Kebede Butchery Management System - Backend

This README provides step-by-step instructions to set up the PostgreSQL database, configure Django, run migrations, and basic usage for the backend of the Kebede Butchery Management System.

---

## 1. Prerequisites

- **Python 3.8+**
- **PostgreSQL 12+**
- **pip** (Python package manager)
- **Git** (optional, for cloning the repository)

---

## 2. Clone the Repository

```sh
git clone <your-repo-url>
cd kebede-butchery-ms/backend
```

---

## 3. Set Up PostgreSQL Database

### a. Start PostgreSQL Service
- Make sure PostgreSQL is installed and running on your system.

### b. Open PostgreSQL Shell
```sh
psql -U postgres
```

### c. Create Database and User
```sql
CREATE DATABASE kebede_pos_db;
CREATE USER kebede_user WITH PASSWORD '1234';
GRANT ALL PRIVILEGES ON DATABASE kebede_pos_db TO kebede_user;
```

### d. Connect to the Database
```sql
\c kebede_pos_db
```

---

## 4. (Optional) Create Tables Manually (if not using Django models)
If you want to create tables manually, use the provided SQL schema. Otherwise, skip to the next step to use Django migrations.

---

## 5. Configure Django Settings

Edit `kebede_pos/settings.py` and ensure the `DATABASES` section matches:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kebede_pos_db',
        'USER': 'kebede_user',
        'PASSWORD': '1234',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
```

---

## 6. Install Python Dependencies

```sh
pip install -r ../requirements.txt
```

---

## 7. Run Django Migrations

```sh
python manage.py makemigrations
python manage.py migrate
```

This will create all necessary tables, including Django's built-in authentication tables.

---

## 8. Create a Superuser (for Django Admin)

```sh
python manage.py createsuperuser
```
Follow the prompts to set up your admin account.

---

## 9. Run the Development Server

```sh
python manage.py runserver
```

Visit [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) to access the Django admin interface.

---

## 10. Useful PostgreSQL Commands

- List all databases:
  ```sql
  \l
  ```
- Connect to a database:
  ```sql
  \c kebede_pos_db
  ```
- List all tables:
  ```sql
  \dt
  ```

---

## 11. Creating Groups in Django

- Via Django Admin: Go to the admin interface, click on **Groups**, and add new groups.
- Via Django Shell:
  ```python
  from django.contrib.auth.models import Group
  Group.objects.get_or_create(name='waiter')
  ```

---

## 12. Troubleshooting

- **Database connection errors:**
  - Ensure PostgreSQL is running.
  - Check that the port, username, and password in `settings.py` match your PostgreSQL setup.
- **Missing tables:**
  - Run `python manage.py migrate` to create all necessary tables.

---

## 13. License

This project is for educational and internal use. 