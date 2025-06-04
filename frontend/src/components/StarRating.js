import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  size = 'medium', 
  showNumber = true,
  readonly = false,
  maxRating = 5,
  label = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!readonly) {
      setHoverRating(starValue);
      setIsHovering(true);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoverRating(0);
      setIsHovering(false);
    }
  };

  const getStarClass = (starValue) => {
    const baseClass = 'star';
    const sizeClass = `star-${size}`;
    const displayRating = isHovering ? hoverRating : rating;
    
    let fillClass = 'star-empty';
    if (displayRating >= starValue) {
      fillClass = 'star-filled';
    } else if (displayRating >= starValue - 0.5) {
      fillClass = 'star-half';
    }
    
    const interactiveClass = !readonly ? 'star-interactive' : '';
    
    return `${baseClass} ${sizeClass} ${fillClass} ${interactiveClass}`.trim();
  };

  const renderStar = (starValue) => {
    const displayRating = isHovering ? hoverRating : rating;
    const fillClass = getStarClass(starValue);
    
    return (
      <span
        key={starValue}
        className={fillClass}
        onClick={() => handleStarClick(starValue)}
        onMouseEnter={() => handleStarHover(starValue)}
        onMouseLeave={handleStarLeave}
        role={!readonly ? "button" : "presentation"}
        tabIndex={!readonly ? 0 : -1}
        aria-label={!readonly ? `Rate ${starValue} star${starValue !== 1 ? 's' : ''}` : ''}
        onKeyDown={(e) => {
          if (!readonly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleStarClick(starValue);
          }
        }}
      >
        ★
      </span>
    );
  };

  const displayRating = isHovering ? hoverRating : rating;

  return (
    <div className={`star-rating ${size} ${readonly ? 'readonly' : 'interactive'}`}>
      {label && <span className="star-rating-label">{label}</span>}
      <div className="stars-container">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index + 1))}
        {showNumber && (
          <span className="rating-number">
            {displayRating ? displayRating.toFixed(1) : '0.0'}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating; 