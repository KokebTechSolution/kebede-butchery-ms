// Guys U can Write in this folder for your routes
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MeatDashboard from '../pages/Meat/MeatDashboard';
import BartenderDashboard from '../pages/Bartender/BartenderDashboard';
import RoleBasedDashboard from '../pages/RoleBasedDashboard';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/meat-dashboard" element={<ProtectedRoute allowedRoles={['meat']}><MeatDashboard /></ProtectedRoute>} />
            <Route path="/bartender-dashboard" element={<ProtectedRoute allowedRoles={['bartender']}><BartenderDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
        </Routes>
    );
};

export default AppRoutes;