import React, { useState } from 'react';
import StarRating from './StarRating';
import { reviewApi } from '../api/reviewApi';
import './ReviewCard.css';

const ReviewCard = ({ 
  review, 
  currentUser, 
  onHelpfulVote, 
  onVendorResponse,
  showVendorResponseForm = false 
}) => {
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseComment, setResponseComment] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [localReview, setLocalReview] = useState(review);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleHelpfulClick = async () => {
    if (isHelpfulLoading) return;

    setIsHelpfulLoading(true);
    try {
      const response = await reviewApi.markReviewHelpful(localReview._id);
      
      // Update local state
      setLocalReview(prev => ({
        ...prev,
        helpfulVotes: {
          ...prev.helpfulVotes,
          count: response.helpfulCount,
          voters: [...prev.helpfulVotes.voters, { user: currentUser.id }]
        }
      }));

      if (onHelpfulVote) {
        onHelpfulVote(localReview._id, response.helpfulCount);
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    } finally {
      setIsHelpfulLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseComment.trim() || isSubmittingResponse) return;

    setIsSubmittingResponse(true);
    try {
      const response = await reviewApi.addVendorResponse(localReview._id, {
        comment: responseComment,
        isPublic: true
      });

      // Update local state
      setLocalReview(prev => ({
        ...prev,
        vendorResponse: response.review.vendorResponse
      }));

      setShowResponseForm(false);
      setResponseComment('');

      if (onVendorResponse) {
        onVendorResponse(localReview._id, response.review.vendorResponse);
      }
    } catch (error) {
      console.error('Error submitting vendor response:', error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const canMarkHelpful = currentUser && 
    localReview.customer._id !== currentUser.id && 
    !localReview.helpfulVotes.voters.some(voter => voter.user === currentUser.id);

  const canRespondAsVendor = currentUser && 
    localReview.vendor._id === currentUser.id && 
    !localReview.vendorResponse.comment &&
    showVendorResponseForm;

  return (
    <div className="review-card">
      {/* Customer Information */}
      <div className="review-header">
        <div className="customer-info">
          <div className="customer-details">
            <h4 className="customer-name">
              {localReview.customer.firstName} {localReview.customer.lastName}
            </h4>
            <span className="review-date">{formatDate(localReview.createdAt)}</span>
          </div>
        </div>
        
        <div className="review-rating">
          <StarRating 
            rating={
              (localReview.ratings.overall + 
               localReview.ratings.quality + 
               localReview.ratings.communication + 
               localReview.ratings.punctuality + 
               localReview.ratings.professionalism + 
               localReview.ratings.value) / 6
            } 
            readonly={true}
            size="large"
            showNumber={true}
          />
        </div>
      </div>

      {/* Review Content */}
      <div className="review-content">
        <h3 className="review-title">{localReview.title}</h3>
        <p className="review-comment">{localReview.comment}</p>

        {/* Service Information */}
        {localReview.service && (
          <div className="service-mention">
            <span className="service-label">Service:</span>
            <span className="service-name">{localReview.service.title}</span>
          </div>
        )}
      </div>

      {/* Review Insights */}
      <div className="review-insights">
        <div className="insight-badges">
          {localReview.isRecommended && (
            <span className="badge badge-positive">
              <span className="badge-icon">👍</span>
              Recommends
            </span>
          )}
          {localReview.wouldHireAgain && (
            <span className="badge badge-positive">
              <span className="badge-icon">🔁</span>
              Would hire again
            </span>
          )}
          {localReview.completedOnTime && (
            <span className="badge badge-neutral">
              <span className="badge-icon">⏰</span>
              On time
            </span>
          )}
          {localReview.matchedDescription && (
            <span className="badge badge-neutral">
              <span className="badge-icon">✅</span>
              As described
            </span>
          )}
        </div>
      </div>

      {/* Vendor Response */}
      {localReview.vendorResponse.comment && (
        <div className="vendor-response">
          <div className="vendor-response-header">
            <span className="vendor-label">Response from vendor</span>
            <span className="response-date">
              {formatDate(localReview.vendorResponse.respondedAt)}
            </span>
          </div>
          <p className="vendor-response-comment">
            {localReview.vendorResponse.comment}
          </p>
        </div>
      )}

      {/* Vendor Response Form */}
      {canRespondAsVendor && !showResponseForm && (
        <button 
          className="respond-button"
          onClick={() => setShowResponseForm(true)}
        >
          Respond to this review
        </button>
      )}

      {showResponseForm && canRespondAsVendor && (
        <form onSubmit={handleSubmitResponse} className="vendor-response-form">
          <div className="form-group">
            <label htmlFor="responseComment">Your response</label>
            <textarea
              id="responseComment"
              value={responseComment}
              onChange={(e) => setResponseComment(e.target.value)}
              placeholder="Thank the customer and address any concerns..."
              rows={4}
              maxLength={500}
              required
            />
            <small>{responseComment.length}/500 characters</small>
          </div>
          <div className="response-form-actions">
            <button
              type="button"
              onClick={() => {
                setShowResponseForm(false);
                setResponseComment('');
              }}
              className="btn-secondary"
              disabled={isSubmittingResponse}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmittingResponse || !responseComment.trim()}
            >
              {isSubmittingResponse ? 'Submitting...' : 'Post Response'}
            </button>
          </div>
        </form>
      )}

      {/* Review Actions */}
      <div className="review-actions">
        <div className="helpful-section">
          {canMarkHelpful && (
            <button
              onClick={handleHelpfulClick}
              disabled={isHelpfulLoading}
              className="helpful-button"
            >
              <span className="helpful-icon">👍</span>
              {isHelpfulLoading ? 'Marking...' : 'Helpful'}
            </button>
          )}
          {localReview.helpfulVotes.count > 0 && (
            <span className="helpful-count">
              {localReview.helpfulVotes.count} {localReview.helpfulVotes.count === 1 ? 'person' : 'people'} found this helpful
            </span>
          )}
        </div>

        {localReview.isVerified && (
          <div className="verification-badge">
            <span className="verified-icon">✓</span>
            Verified Purchase
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard; 