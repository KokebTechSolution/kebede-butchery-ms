# kebede_pos/deployment_settings.py

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '192.168.1.4',
    '192.168.155.0/24',
    'kebede-butchery-ms.onrender.com',
    'kebede-butchery-ms.vercel.app',
    '.onrender.com',
    '.vercel.app',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.4:3000",
    "http://192.168.1.8:3001",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.4:3000",
    "http://192.168.1.120:3001",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

EXTRA_CSRF_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
