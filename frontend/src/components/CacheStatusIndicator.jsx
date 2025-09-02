import React, { useState, useEffect } from 'react';
import { CacheManager } from '../utils/cacheUtils';

const CacheStatusIndicator = () => {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    updateCacheStatus();
  }, []);

  const updateCacheStatus = () => {
    const status = CacheManager.getCacheStatus();
    setCacheStatus(status);
  };

  const handleClearAllCaches = () => {
    CacheManager.clearAllCaches();
    updateCacheStatus();
  };

  const handleResetPrintTrigger = () => {
    CacheManager.resetPrintTrigger();
    updateCacheStatus();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '16px',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
        title="Cache Status"
      >
        📦
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 1001,
        minWidth: '300px',
        maxWidth: '400px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>📦 Cache Status</h4>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ✕
        </button>
      </div>

      {cacheStatus && (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Last Cache:</strong> {cacheStatus.lastCacheTime}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Print Triggered:</strong> 
            <span style={{ color: cacheStatus.printTrigger ? '#ef4444' : '#22c55e', marginLeft: '4px' }}>
              {cacheStatus.printTrigger ? 'Yes' : 'No'}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Menu Items:</strong> 
            <span style={{ color: cacheStatus.hasMenuItems ? '#22c55e' : '#ef4444', marginLeft: '4px' }}>
              {cacheStatus.hasMenuItems ? 'Cached' : 'Not Cached'}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Barman Stock:</strong> 
            <span style={{ color: cacheStatus.hasBarmanStock ? '#22c55e' : '#ef4444', marginLeft: '4px' }}>
              {cacheStatus.hasBarmanStock ? 'Cached' : 'Not Cached'}
            </span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Cache Valid:</strong> 
            <span style={{ color: cacheStatus.isCacheValid ? '#22c55e' : '#ef4444', marginLeft: '4px' }}>
              {cacheStatus.isCacheValid ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={handleClearAllCaches}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
        <button
          onClick={handleResetPrintTrigger}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Reset Print
        </button>
        <button
          onClick={updateCacheStatus}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default CacheStatusIndicator;
