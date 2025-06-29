import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import BranchManagerRoutes from './BranchManagerRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="branch-manager/*"
        element={
          <ProtectedRoute requiredRole="branch_manager">
            <BranchManagerRoutes />
          </ProtectedRoute>
        }
      />
      {/* Add other top-level routes here */}
    </Routes>
  );
}
