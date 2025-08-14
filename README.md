# 🥩 Kebede Butchery Management System

A comprehensive, multi-branch restaurant and butchery management system designed for modern food service operations. Built with Django REST Framework backend and React frontend, featuring role-based access control, real-time inventory management, and responsive design for mobile, tablet, and desktop devices.

![Kebede Butchery](https://img.shields.io/badge/Version-1.0.0-blue)
![Django](https://img.shields.io/badge/Django-5.2.4-green)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.2-38B2AC)

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control](#-role-based-access-control)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🏢 Multi-Branch Management
- **Branch-specific data isolation** - Each branch operates independently
- **Centralized oversight** - Owner can monitor all branches
- **Branch manager autonomy** - Local management capabilities

### 👥 Role-Based Access Control
- **Owner** - Full system access and analytics
- **Branch Manager** - Branch-specific management
- **Cashier** - Payment processing and order management
- **Waiter** - Order taking and table management
- **Bartender** - Beverage inventory and order processing
- **Meat Counter** - Food preparation and order management

### 📱 Responsive Design
- **Mobile-first approach** - Optimized for smartphones
- **Tablet support** - Enhanced interface for tablets
- **Desktop experience** - Full-featured desktop interface
- **Cross-platform compatibility** - Works on all devices

### 🛒 Order Management
- **Real-time order tracking** - Live status updates
- **Multi-item orders** - Food and beverage combinations
- **Payment processing** - Multiple payment methods
- **Table management** - Dynamic table assignment

### 📊 Inventory Management
- **Stock tracking** - Real-time inventory levels
- **Automatic alerts** - Low stock notifications
- **Inventory requests** - Automated restocking system
- **Product conversions** - Unit conversion management

### 🌐 Internationalization
- **Multi-language support** - English, Amharic, Oromifa
- **Localized interfaces** - Culture-specific UI elements
- **Dynamic language switching** - Real-time language changes

### 📈 Analytics & Reporting
- **Sales analytics** - Revenue tracking and trends
- **Performance metrics** - Staff and branch performance
- **Inventory reports** - Stock level analysis
- **Financial reporting** - Profit and loss tracking

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Django)      │◄──►│   (SQLite/      │
│                 │    │                 │    │    PostgreSQL)  │
│ • Responsive UI │    │ • REST API      │    │                 │
│ • Role-based    │    │ • Authentication│    │                 │
│ • i18n Support  │    │ • Business Logic│    │                 │
│ • Real-time     │    │ • Data Models   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 👥 Role-Based Access Control

| Role | Access Level | Primary Functions |
|------|-------------|-------------------|
| **Owner** | System-wide | Analytics, user management, branch oversight |
| **Branch Manager** | Branch-specific | Staff management, inventory, local reports |
| **Cashier** | Branch-specific | Payment processing, order management |
| **Waiter** | Branch-specific | Order taking, table management |
| **Bartender** | Branch-specific | Beverage inventory, order processing |
| **Meat Counter** | Branch-specific | Food preparation, order management |

## 🛠️ Technology Stack

### Backend
- **Django 5.2.4** - Web framework
- **Django REST Framework** - API development
- **Django Channels** - WebSocket support
- **PostgreSQL/SQLite** - Database
- **JWT Authentication** - Secure authentication
- **Django CORS Headers** - Cross-origin support

### Frontend
- **React 19.1.0** - UI framework
- **TypeScript 4.9.5** - Type safety
- **Tailwind CSS 3.3.2** - Styling
- **React Router DOM** - Navigation
- **Axios** - HTTP client
- **React i18next** - Internationalization
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Development Tools
- **Node.js** - JavaScript runtime
- **npm** - Package manager
- **Python 3.13** - Backend runtime
- **Git** - Version control

## 🚀 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Git** (for version control)
- **PostgreSQL** (optional, SQLite is default)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/kebede-butchery-ms.git
   cd kebede-butchery-ms
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start backend server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## ⚡ Quick Start

### Using the Batch File (Windows)
```bash
# Simply run the start.bat file
start.bat
```

This will automatically start both backend and frontend servers.

### Manual Start
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: https://kebede-butchery-ms.onrender.com
- **Admin Panel**: https://kebede-butchery-ms.onrender.com/admin

## 📚 API Documentation

### Authentication
```http
POST /api/users/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/` | GET | User management |
| `/api/orders/` | GET/POST | Order management |
| `/api/inventory/` | GET/POST | Inventory management |
| `/api/menu/` | GET | Menu items |
| `/api/payments/` | GET/POST | Payment processing |
| `/api/branches/` | GET | Branch information |

### Example API Usage
```javascript
// Get orders for current user's branch
const response = await axios.get('/api/orders/printed-orders/', {
  params: { date: '2025-07-30' }
});

// Create new order
const orderData = {
  table: 1,
  items: [
    { name: 'Coca', quantity: 2, price: 50.00, item_type: 'beverage' }
  ]
};
await axios.post('/api/orders/', orderData);
```

## 🔧 Development

### Project Structure
```
kebede-butchery-ms/
├── backend/                 # Django backend
│   ├── kebede_pos/         # Main Django project
│   ├── users/              # User management
│   ├── orders/             # Order management
│   ├── inventory/          # Inventory system
│   ├── menu/               # Menu management
│   ├── payments/           # Payment processing
│   ├── branches/           # Branch management
│   └── reports/            # Analytics and reporting
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API integration
│   │   ├── context/        # React context
│   │   └── locales/        # Internationalization
│   └── public/             # Static assets
└── docs/                   # Documentation
```

### Code Style
- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: Use ESLint and Prettier
- **Git**: Conventional commit messages

### Testing
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   # Backend (.env)
   DEBUG=False
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgresql://user:pass@host:port/db
   
   # Frontend (.env)
   REACT_APP_API_URL=https://your-api-domain.com
   ```

2. **Database Migration**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

3. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@kebedebutchery.com
- **Documentation**: [Wiki](https://github.com/your-username/kebede-butchery-ms/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/kebede-butchery-ms/issues)

## 🙏 Acknowledgments

- **Django Community** - For the excellent web framework
- **React Team** - For the powerful UI library
- **Tailwind CSS** - For the utility-first CSS framework
- **All Contributors** - For making this project possible

---

**Made with ❤️ for Kebede Butchery**

*Empowering modern food service operations with technology*
