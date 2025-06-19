// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../BranchManager/BranchManagerDashboard';

import StaffListPage from './pages/Staff/StaffListPage';
import AddStaffForm from './pages/Staff/AddStaffForm';
import InventoryListPage from '../Inventory/InventoryListPage';
import AddInventoryItem from '../Inventory/AddInventoryItem';
import SidebarNav from './components/ManagmentComponents/SidebarNav';
import Topbar from '../../components/ManagmentComponents/Topbar';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <SidebarNav />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-4 flex-grow bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/staff" element={<StaffListPage />} />
              <Route path="/staff/add" element={<AddStaffForm />} />
              <Route path="/inventory" element={<InventoryListPage />} />
              <Route path="/inventory/add" element={<AddInventoryItem />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
