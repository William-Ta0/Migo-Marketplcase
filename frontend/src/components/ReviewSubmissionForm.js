import React, { useState } from 'react';
import StarRating from './StarRating';
import { reviewApi } from '../api/reviewApi';
import './ReviewSubmissionForm.css';

const ReviewSubmissionForm = ({ job, onReviewSubmitted, onCancel }) => {
  const [formData, setFormData] = useState({
    ratings: {
      overall: 0,
      quality: 0,
      communication: 0,
      punctuality: 0,
      professionalism: 0,
      value: 0
    },
    comment: '',
    isRecommended: null,
    wouldHireAgain: null,
    completedOnTime: null,
    matchedDescription: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: rating
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    // Check if all ratings are provided
    const ratingFields = ['overall', 'quality', 'communication', 'punctuality', 'professionalism', 'value'];
    for (const field of ratingFields) {
      if (!formData.ratings[field] || formData.ratings[field] < 1) {
        setError(`Please provide a rating for ${field}`);
        return false;
      }
    }

    if (!formData.comment.trim()) {
      setError('Please provide a review comment');
      return false;
    }

    if (formData.isRecommended === null) {
      setError('Please indicate if you would recommend this vendor');
      return false;
    }

    if (formData.wouldHireAgain === null) {
      setError('Please indicate if you would hire this vendor again');
      return false;
    }

    if (formData.completedOnTime === null) {
      setError('Please indicate if the job was completed on time');
      return false;
    }

    if (formData.matchedDescription === null) {
      setError('Please indicate if the service matched the description');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        jobId: job._id,
        ...formData
      };

      const response = await reviewApi.createReview(reviewData);
      
      if (onReviewSubmitted) {
        onReviewSubmitted(response.review);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingCategories = [
    { key: 'overall', label: 'Overall Experience', description: 'Your overall satisfaction with the service' },
    { key: 'quality', label: 'Quality of Work', description: 'How satisfied are you with the quality of work delivered?' },
    { key: 'communication', label: 'Communication', description: 'How well did the vendor communicate throughout the job?' },
    { key: 'punctuality', label: 'Punctuality', description: 'Did the vendor meet deadlines and appointments?' },
    { key: 'professionalism', label: 'Professionalism', description: 'How professional was the vendor\'s behavior and approach?' },
    { key: 'value', label: 'Value for Money', description: 'Do you feel you received good value for the price paid?' }
  ];

  return (
    <div className="review-submission-form">
      <div className="review-form-header">
        <h2>Write a Review</h2>
        <p>Share your experience with {job.vendor?.firstName} {job.vendor?.lastName}</p>
      </div>

      <form onSubmit={handleSubmit} className="review-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Service Information */}
        <div className="service-info">
          <h3>{job.service?.title}</h3>
          <p className="service-description">{job.description}</p>
        </div>

        {/* Rating Categories */}
        <div className="rating-section">
          <h3>Rate Your Experience</h3>
          <div className="rating-categories">
            {ratingCategories.map(category => (
              <div key={category.key} className="rating-category">
                <div className="rating-category-info">
                  <label className="rating-label">{category.label}</label>
                  <p className="rating-description">{category.description}</p>
                </div>
                <StarRating
                  rating={formData.ratings[category.key]}
                  onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                  size="large"
                  showNumber={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Review Content */}
        <div className="review-content-section">
          <h3>Review Details</h3>
          
          <div className="form-group">
            <label htmlFor="comment">Your Review *</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Tell others about your experience with this vendor..."
              rows={5}
              maxLength={1000}
              required
            />
            <small>{formData.comment.length}/1000 characters</small>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="quick-questions-section">
          <h3>Quick Questions</h3>
          
          <div className="question-group">
            <label className="question-label">Would you recommend this vendor to others? *</label>
            <div className="radio-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="isRecommended"
                  value="true"
                  checked={formData.isRecommended === true}
                  onChange={handleInputChange}
                />
                <span>Yes, I recommend them</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="isRecommended"
                  value="false"
                  checked={formData.isRecommended === false}
                  onChange={handleInputChange}
                />
                <span>No, I don't recommend them</span>
              </label>
            </div>
          </div>

          <div className="question-group">
            <label className="question-label">Would you hire this vendor again? *</label>
            <div className="radio-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="wouldHireAgain"
                  value="true"
                  checked={formData.wouldHireAgain === true}
                  onChange={handleInputChange}
                />
                <span>Yes, definitely</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="wouldHireAgain"
                  value="false"
                  checked={formData.wouldHireAgain === false}
                  onChange={handleInputChange}
                />
                <span>No, probably not</span>
              </label>
            </div>
          </div>

          <div className="question-group">
            <label className="question-label">Was the job completed on time? *</label>
            <div className="radio-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="completedOnTime"
                  value="true"
                  checked={formData.completedOnTime === true}
                  onChange={handleInputChange}
                />
                <span>Yes, on time</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="completedOnTime"
                  value="false"
                  checked={formData.completedOnTime === false}
                  onChange={handleInputChange}
                />
                <span>No, was delayed</span>
              </label>
            </div>
          </div>

          <div className="question-group">
            <label className="question-label">Did the service match the description? *</label>
            <div className="radio-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="matchedDescription"
                  value="true"
                  checked={formData.matchedDescription === true}
                  onChange={handleInputChange}
                />
                <span>Yes, as described</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="matchedDescription"
                  value="false"
                  checked={formData.matchedDescription === false}
                  onChange={handleInputChange}
                />
                <span>No, different than expected</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewSubmissionForm; 