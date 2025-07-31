# 🌐 Local Network Access Guide

## 📱 **Access Your App from Any Device on Same WiFi**

### **Your Network Details:**
- **Your Computer IP**: `192.168.1.2`
- **Frontend URL**: `http://192.168.1.2:3000`
- **Backend API**: `http://192.168.1.2:8000`

## 🚀 **Quick Start**

### **1. Start Backend (Terminal 1)**
```bash
cd backend
start-network.bat
```
**Or manually:**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### **2. Start Frontend (Terminal 2)**
```bash
cd frontend
start-network.bat
```
**Or manually:**
```bash
cd frontend
set REACT_APP_API_URL=http://192.168.1.2:8000
npm start
```

## 📱 **Access from Other Devices**

### **From Phone/Tablet:**
1. Connect to same WiFi network
2. Open browser
3. Go to: `http://192.168.1.2:3000`

### **From Other Computers:**
1. Connect to same WiFi network
2. Open browser
3. Go to: `http://192.168.1.2:3000`

## 🔧 **Troubleshooting**

### **If Can't Access:**
1. **Check Windows Firewall:**
   - Allow Python and Node.js through firewall
   - Or temporarily disable firewall for testing

2. **Check Antivirus:**
   - Some antivirus software blocks network access
   - Add exceptions for your development ports

3. **Verify Network:**
   ```bash
   # Test if backend is accessible
   curl http://192.168.1.2:8000/api/users/csrf/
   ```

### **Windows Firewall Settings:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Python and Node.js
4. Allow on both Private and Public networks

## 📋 **Network URLs**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://192.168.1.2:3000` | React App |
| **Backend API** | `http://192.168.1.2:8000` | Django API |
| **Admin Panel** | `http://192.168.1.2:8000/admin` | Django Admin |

## 🎯 **Testing Checklist**

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access from your computer
- [ ] Can access from phone/tablet
- [ ] Login works from other devices
- [ ] All features work from network

## 🔒 **Security Note**

This setup is for **development only**. For production:
- Use HTTPS
- Configure proper security headers
- Use environment variables for sensitive data

Your app is now ready for local network testing! 🎉 