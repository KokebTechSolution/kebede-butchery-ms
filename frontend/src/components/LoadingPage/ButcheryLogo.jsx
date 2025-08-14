import React from 'react';
import './ButcheryLogo.css';

const ButcheryLogo = ({ isAnimating = true }) => {
  return (
    <div className="butchery-logo-container">
      <svg 
        viewBox="0 0 200 200" 
        className={`butchery-logo ${isAnimating ? 'animating' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="#667eea" strokeWidth="2" opacity="0.3"/>
        
        {/* Meat piece */}
        <g className="meat-piece">
          <ellipse cx="100" cy="110" rx="35" ry="25" fill="#8B4513" opacity="0.8"/>
          <ellipse cx="100" cy="110" rx="30" ry="20" fill="#A0522D" opacity="0.9"/>
          <ellipse cx="100" cy="110" rx="25" ry="15" fill="#CD853F" opacity="0.7"/>
          
          {/* Meat texture lines */}
          <line x1="85" y1="105" x2="115" y2="105" stroke="#654321" strokeWidth="1" opacity="0.6"/>
          <line x1="90" y1="115" x2="110" y2="115" stroke="#654321" strokeWidth="1" opacity="0.6"/>
          <line x1="95" y1="125" x2="105" y2="125" stroke="#654321" strokeWidth="1" opacity="0.6"/>
        </g>
        
        {/* Knife */}
        <g className="knife">
          {/* Knife handle */}
          <rect x="140" y="85" width="8" height="30" fill="#8B4513" rx="2"/>
          <rect x="142" y="87" width="4" height="26" fill="#A0522D" rx="1"/>
          
          {/* Knife blade */}
          <polygon 
            points="140,85 160,75 160,105 140,115" 
            fill="#C0C0C0" 
            stroke="#808080" 
            strokeWidth="1"
          />
          
          {/* Knife blade shine */}
          <polygon 
            points="142,87 158,77 158,103 142,113" 
            fill="#E0E0E0" 
            opacity="0.7"
          />
          
          {/* Knife cutting edge */}
          <line x1="160" y1="75" x2="160" y2="105" stroke="#404040" strokeWidth="0.5"/>
        </g>
        
        {/* Cutting animation line */}
        <line 
          className="cut-line"
          x1="70" y1="90" x2="130" y2="130" 
          stroke="#FF6B35" 
          strokeWidth="3" 
          strokeDasharray="5,5"
          opacity="0"
        />
        
        {/* Meat cut pieces (appear after cutting) */}
        <g className="meat-cut-left" opacity="0">
          <ellipse cx="80" cy="110" rx="15" ry="10" fill="#8B4513" opacity="0.8"/>
          <ellipse cx="80" cy="110" rx="12" ry="8" fill="#A0522D" opacity="0.9"/>
        </g>
        
        <g className="meat-cut-right" opacity="0">
          <ellipse cx="120" cy="110" rx="15" ry="10" fill="#8B4513" opacity="0.8"/>
          <ellipse cx="120" cy="110" rx="12" ry="8" fill="#A0522D" opacity="0.9"/>
        </g>
        
        {/* Butchery name */}
        <text x="100" y="160" textAnchor="middle" className="butchery-name">
          KEBEDE BUTCHERY
        </text>
      </svg>
    </div>
  );
};

export default ButcheryLogo; 