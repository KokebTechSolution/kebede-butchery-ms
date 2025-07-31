import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthContextTest = () => {
  const auth = useAuth();
  
  console.log('AuthContext test - Available functions:', Object.keys(auth));
  console.log('AuthContext test - User:', auth.user);
  console.log('AuthContext test - Login function:', typeof auth.login);
  console.log('AuthContext test - setUser function:', typeof auth.setUser);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">AuthContext Test</h3>
      <div className="space-y-2 text-sm">
        <div>User: {auth.user ? 'Logged in' : 'Not logged in'}</div>
        <div>Login function: {typeof auth.login}</div>
        <div>setUser function: {typeof auth.setUser}</div>
        <div>isAuthenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default AuthContextTest; 