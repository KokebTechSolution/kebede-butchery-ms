import React, { useEffect, useRef } from 'react';

const NotificationPopup = ({ message, orderNumber, tableName, onClose, soundSrc }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const playSound = async () => {
      if (audioRef.current && soundSrc) {
        try {
          console.log('🔊 Attempting to play notification sound:', soundSrc);
          
          // Reset audio to beginning
          audioRef.current.currentTime = 0;
          // Ensure volume is set
          audioRef.current.volume = 0.7;
          // Ensure audio is not muted
          audioRef.current.muted = false;
          
          // Play the sound
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('🔊 Notification sound played successfully');
          }
        } catch (error) {
          console.warn('🔇 Could not play notification sound:', error);
          // Try alternative approach for browsers that block autoplay
          if (error.name === 'NotAllowedError') {
            console.log('🔇 Autoplay blocked, user interaction required');
          }
        }
      } else {
        console.log('🔇 No audio element or sound source available');
      }
    };

    // Play sound when notification appears
    playSound();
  }, [soundSrc]);

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
          preload="auto"
          onError={(e) => console.error('🔇 Audio error:', e)}
          onLoadStart={() => console.log('🔊 Loading notification sound...')}
          onCanPlay={() => console.log('🔊 Notification sound ready to play')}
          onLoadedData={() => console.log('🔊 Notification sound data loaded')}
          onPlay={() => console.log('🔊 Notification sound started playing')}
          onEnded={() => console.log('🔊 Notification sound finished')}
        />
      )}
    </div>
  );
};

export default NotificationPopup;
