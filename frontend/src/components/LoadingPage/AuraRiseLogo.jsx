import React from 'react';
import './AuraRiseLogo.css';

const AuraRiseLogo = () => {
  return (
    <div className="aurarise-logo-container">
      <svg 
        viewBox="0 0 200 60" 
        className="aurarise-logo"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* AuraRise text */}
        <text x="100" y="25" textAnchor="middle" className="aurarise-text">
          AuraRise
        </text>
        
        {/* Tech Solutions text */}
        <text x="100" y="45" textAnchor="middle" className="tech-solutions-text">
          Tech Solutions
        </text>
        
        {/* Decorative elements */}
        <circle cx="30" cy="15" r="3" fill="#667eea" className="decorative-dot"/>
        <circle cx="170" cy="15" r="3" fill="#764ba2" className="decorative-dot"/>
        <circle cx="30" cy="45" r="2" fill="#f093fb" className="decorative-dot"/>
        <circle cx="170" cy="45" r="2" fill="#667eea" className="decorative-dot"/>
        
        {/* Connecting lines */}
        <line x1="35" y1="15" x2="165" y2="15" stroke="#667eea" strokeWidth="1" opacity="0.3"/>
        <line x1="35" y1="45" x2="165" y2="45" stroke="#764ba2" strokeWidth="1" opacity="0.3"/>
        
        {/* Aura effect */}
        <ellipse cx="100" cy="35" rx="80" ry="25" fill="none" stroke="url(#auraGradient)" strokeWidth="1" opacity="0.2"/>
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#667eea"/>
            <stop offset="50%" stopColor="#764ba2"/>
            <stop offset="100%" stopColor="#f093fb"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AuraRiseLogo; 