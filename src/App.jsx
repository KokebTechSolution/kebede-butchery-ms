import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import TablesPage from './pages/waiter/tables/TablesPage.jsx';
import MenuPage from './pages/waiter/menu/MenuPage.jsx';
import OrdersPage from './pages/waiter/order/OrdersPage.jsx';
import Cart from './components/Cart/Cart.jsx';
import { CartProvider } from './context/CartContext';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('tables'); // 'tables', 'menu', or 'order'
  const [selectedTable, setSelectedTable] = useState(null);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'tables') {
      setSelectedTable(null);
    } else if (page === 'menu') {
      // If navigating to menu from navbar, clear selected table unless it's already set from table click
      if (!selectedTable) {
        setSelectedTable(null); // Ensure it's null if not from a table click
      }
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setCurrentPage('menu');
  };

  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
  };

  const handleOrder = () => {
    setCurrentPage('order');
  };

  return (
    <CartProvider initialActiveTableId={selectedTable ? selectedTable.id : null}>
      <div className="app-container">
        <Navbar onNavigate={handleNavigate} />
        <div className="main-content white-bg">
          {currentPage === 'tables' && (
            <TablesPage onSelectTable={handleTableSelect} />
          )}
          {currentPage === 'menu' && (
            <div className="menu-cart-container">
              <div className="menu-section">
                <MenuPage table={selectedTable} onBack={handleBackFromMenu} />
              </div>
              <div className="cart-section">
                <Cart onOrder={handleOrder} />
              </div>
            </div>
          )}
          {currentPage === 'order' && (
            <OrdersPage setCurrentPage={setCurrentPage} isNewOrderFromCart={true} />
          )}
        </div>
      </div>
    </CartProvider>
  );
}

export default App;
