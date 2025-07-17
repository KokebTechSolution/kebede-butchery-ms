import React, { useEffect, useRef } from 'react';

const NotificationPopup = ({ message, orderNumber, tableName, onClose, soundSrc }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const playSound = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        } catch (error) {
          console.warn('Autoplay blocked by browser:', error);
        }
      }
    };
    playSound();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#fff',
      border: '2px solid #007bff',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 9999,
      padding: '20px 40px',
      minWidth: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{message}</div>
      <div style={{ marginBottom: 8 }}>
        <span>Order No: <b>{orderNumber}</b></span><br />
        <span>Table: <b>{tableName}</b></span>
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: 8,
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '6px 16px',
          cursor: 'pointer',
        }}
      >
        Close
      </button>
      {soundSrc && (
        <audio
          ref={audioRef}
          src={soundSrc}
          muted // optional: prevent autoplay issues
          onCanPlay={() => {
            audioRef.current.muted = false; // unmute after load if needed
          }}
        />
      )}
    </div>
  );
};

export default NotificationPopup;
