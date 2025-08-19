# kebede_pos/deployment_settings.py

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '10.240.69.22',
    '192.168.1.6',
    '192.168.1.7',  # Current network IP
    '192.168.100.122',
    '192.168.155.0/24',
    'kebede-butchery-ms.onrender.com',
    'https://kebede-butchery-ms-o9x4.vercel.app',
    '.onrender.com',
    '.vercel.app',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.6:3000",
    "http://192.168.1.7:3000",  # Current network IP
    "http://192.168.100.122:3000",
    'http://10.240.69.22:3000',
    'https://kebede-butchery-ms-09x4.vercel.app',  # Updated Vercel domain
    'https://kebede-butchery-ms-o9x4.vercel.app',
    "http://192.168.1.8:3001",
    "http://192.168.1.7:3001",  # Current network IP
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://kebede-butchery-ms.onrender.com",
    # Add wildcard for Vercel subdomains
    "https://*.vercel.app",
    "https://*.onrender.com"
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.6:3000",
    "http://192.168.1.7:3000",  # Current network IP
    'http://10.240.69.22:3000',
    'https://kebede-butchery-ms-09x4.vercel.app',  # Updated Vercel domain
    'https://kebede-butchery-ms-o9x4.vercel.app',
    'https://kebede-butchery-ms.onrender.com',
    "http://192.168.1.8:3001",
    "http://192.168.1.7:3001",  # Current network IP
    "http://192.168.1.120:3001",
    "http://192.168.100.122:3000",
    "http://localhost:3001",
    "http://127.0.0.1:1",
    # Add wildcard for Vercel subdomains
    "https://*.vercel.app",
    "https://*.onrender.com"
]

EXTRA_CSRF_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
