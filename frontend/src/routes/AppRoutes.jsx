import StaffListPage from './pages/staff/StaffListPage';
import AddStaffForm from './pages/staff/AddStaffForm'; // Make sure this exists
import { Routes, Route } from 'react-router-dom';
import BranchManagerRoutes from './routes/BranchManagerRoutes';
import BranchManagerDashboard from './pages/BranchManager/BranchManagerDashboard';
import DashboardHome from './pages/BranchManager/DashboardHome'; // Ensure this file exists 


<Routes>
  <Route path="/branch-manager/staff" element={<StaffListPage />} />
  <Route path="/branch-manager/addstaff" element={<AddStaffForm />} />
</Routes>
