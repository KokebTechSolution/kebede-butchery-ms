const isProd = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProd
  ? 'https://kebede-butchery-ms.onrender.com'
  : 'http://localhost:8000'; 