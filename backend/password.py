from django.contrib.auth.hashers import make_password, check_password

# Hash a password
raw_password = "1234"
hashed_password = make_password(raw_password)
print("Hashed password:", hashed_password)