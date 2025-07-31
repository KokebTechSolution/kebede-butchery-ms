import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initializeSession } from '../../utils/sessionManager';
import ButcheryLogo from './ButcheryLogo';
import AuraRiseLogo from './AuraRiseLogo';
import './LoadingPage.css';

const LoadingPage = ({ onComplete, onError }) => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loadingText, setLoadingText] = useState('Initializing session...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const performSessionInitialization = async () => {
      try {
        console.log('Starting session initialization...');
        console.log('Auth context available:', { user, login });
        
        // Step 1: Verify CSRF token
        setLoadingText('Verifying security token...');
        setProgress(20);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Refresh user data
        setLoadingText('Loading user profile...');
        setProgress(40);
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Calling initializeSession...');
        const sessionResult = await initializeSession();
        console.log('Session result:', sessionResult);
        
        if (sessionResult.success && sessionResult.user) {
          console.log('Session successful, updating user...');
          console.log('User data to login:', sessionResult.user);
          // Use the login function instead of setUser directly
          await login(sessionResult.user);
          console.log('Login function completed');
        } else {
          console.log('Session failed:', sessionResult.error);
        }

        // Step 3: Load initial data
        setLoadingText('Loading application data...');
        setProgress(60);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 4: Verify session is active
        setLoadingText('Finalizing session...');
        setProgress(80);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 5: Complete loading
        setLoadingText('Ready!');
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Call the completion callback
        if (onComplete) {
          onComplete();
        }

      } catch (error) {
        console.error('Session initialization failed:', error);
        setLoadingText('Session initialization failed. Redirecting to login...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Clear any invalid session data
        localStorage.removeItem('user');
        
        // Call onError callback if provided
        if (onError) {
          onError(error.message || 'Session initialization failed');
        } else {
          navigate('/login');
        }
      }
    };

    performSessionInitialization();
  }, [navigate, login, onComplete]);

  return (
    <div className="loading-page">
      <div className="loading-container">
        {/* Butchery Logo with Knife Animation */}
        <ButcheryLogo isAnimating={true} />
        
        <div className="loading-content">
          <h2 className="loading-title">Welcome Back!</h2>
          <p className="loading-text">{loadingText}</p>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="loading-steps">
            <div className={`step ${progress >= 20 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-text">Security Check</span>
            </div>
            <div className={`step ${progress >= 40 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-text">User Profile</span>
            </div>
            <div className={`step ${progress >= 60 ? 'completed' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-text">App Data</span>
            </div>
            <div className={`step ${progress >= 80 ? 'completed' : ''}`}>
              <span className="step-number">4</span>
              <span className="step-text">Session Ready</span>
            </div>
          </div>
          
          {/* AuraRise Tech Solutions Branding */}
          <div className="branding-section">
            <div className="developed-by">Developed by</div>
            <AuraRiseLogo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage; 