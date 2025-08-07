import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Coffee, 
  ClipboardList, 
  UserCircle, 
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Bell,
  Utensils,
  Menu as MenuIcon,
  X,
  LogOut
} from 'lucide-react';

// Components
import TablesPage from './tables/TablesPage';
import MenuPage from './menu/MenuPage';
import Cart from '../../components/Cart/Cart';
import OrderDetails from './order/OrderDetails';
import OrderList from './order/OrderList';
import WaiterProfile from './WaiterProfile';

// Context
import { CartProvider, useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// API
import axiosInstance from '../../api/axiosInstance';
