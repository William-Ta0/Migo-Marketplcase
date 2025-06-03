import React, { useState, useEffect } from 'react';
import { getJobStatusTransitions } from '../api/jobApi';

const JobStatusManager = ({ job, isVendor, isCustomer, onStatusUpdate }) => {
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [reason, setReason] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableTransitions();
  }, [job._id]);

  const fetchAvailableTransitions = async () => {
    try {
      setLoading(true);
      const response = await getJobStatusTransitions(job._id);
      if (response.success) {
        setAvailableTransitions(response.data.availableTransitions);
      }
    } catch (err) {
      console.error('Error fetching transitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (transition) => {
    setSelectedTransition(transition);
    setShowStatusModal(true);
    setReason('');
    setEstimatedCompletionDate('');
    setDeliveryNotes('');
    setError('');
  };

  const confirmStatusChange = async () => {
    try {
      setError('');
      
      // Validation
      if (selectedTransition.status === 'rejected' && !reason.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }

      if (selectedTransition.status === 'cancelled' && !reason.trim()) {
        setError('Please provide a reason for cancellation');
        return;
      }

      const additionalData = {};
      
      if (estimatedCompletionDate) {
        additionalData.estimatedCompletionDate = estimatedCompletionDate;
      }
      
      if (deliveryNotes) {
        additionalData.deliveryNotes = deliveryNotes;
      }

      await onStatusUpdate(selectedTransition.status, reason.trim(), additionalData);
      setShowStatusModal(false);
      setSelectedTransition(null);
    } catch (err) {
      setError('Failed to update status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'reviewing': '#3b82f6',
      'quoted': '#8b5cf6',
      'accepted': '#10b981',
      'confirmed': '#059669',
      'in_progress': '#0ea5e9',
      'completed': '#22c55e',
      'delivered': '#16a34a',
      'cancelled': '#ef4444',
      'disputed': '#dc2626',
      'closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusHistory = () => {
    return job.tracking?.statusHistory || [];
  };

  return (
    <div className="job-status-manager">
      <div className="status-manager-container">
        {/* Current Status */}
        <div className="current-status-card">
          <h3>Current Status</h3>
          <div className="current-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(job.status) }}
            >
              {job.status.replace('_', ' ').toUpperCase()}
            </div>
            <div className="status-details">
              <p>
                {isVendor ? 'You' : 'The vendor'} can take the following actions:
              </p>
            </div>
          </div>
        </div>

        {/* Available Actions */}
        <div className="available-actions-card">
          <h3>Available Actions</h3>
          {loading ? (
            <div className="loading-text">Loading available actions...</div>
          ) : availableTransitions.length > 0 ? (
            <div className="actions-grid">
              {availableTransitions.map((transition, index) => (
                <div key={index} className="action-item">
                  <button
                    className={`action-btn ${transition.status}`}
                    onClick={() => handleStatusChange(transition)}
                    style={{ borderColor: getStatusColor(transition.status) }}
                  >
                    <div className="action-label">{transition.label}</div>
                    <div className="action-description">{transition.description}</div>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-actions">
              <p>No actions available at this time.</p>
              <small>
                {job.status === 'closed' 
                  ? 'This job has been completed and closed.'
                  : 'Please wait for the other party to take action.'
                }
              </small>
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="status-history-card">
          <h3>Status History</h3>
          <div className="status-timeline">
            {getStatusHistory().length > 0 ? (
              getStatusHistory().map((historyItem, index) => (
                <div key={index} className="timeline-item">
                  <div 
                    className="timeline-dot"
                    style={{ backgroundColor: getStatusColor(historyItem.status) }}
                  ></div>
                  <div className="timeline-content">
                    <div className="timeline-status">
                      {historyItem.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="timeline-date">
                      {formatDate(historyItem.timestamp)}
                    </div>
                    {historyItem.reason && (
                      <div className="timeline-reason">
                        Reason: {historyItem.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-history">
                <p>No status history available</p>
              </div>
            )}
          </div>
        </div>

        {/* Job Progress Metrics */}
        <div className="progress-metrics-card">
          <h3>Job Progress</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <label>Time since creation:</label>
              <span>{Math.ceil((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24))} days</span>
            </div>
            {job.scheduling?.confirmedDate && (
              <div className="metric-item">
                <label>Time since start:</label>
                <span>{Math.ceil((new Date() - new Date(job.scheduling.confirmedDate)) / (1000 * 60 * 60 * 24))} days</span>
              </div>
            )}
            {job.scheduling?.duration?.estimated && (
              <div className="metric-item">
                <label>Estimated duration:</label>
                <span>{job.scheduling.duration.estimated} hours</span>
              </div>
            )}
            {job.scheduling?.duration?.actual && (
              <div className="metric-item">
                <label>Actual duration:</label>
                <span>{job.scheduling.duration.actual} hours</span>
              </div>
            )}
            <div className="metric-item">
              <label>Payment status:</label>
              <span className={`payment-status ${job.payment?.status || 'pending'}`}>
                {(job.payment?.status || 'pending').toUpperCase()}
              </span>
            </div>
            <div className="metric-item">
              <label>Messages exchanged:</label>
              <span>{job.messages?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedTransition && (
        <div className="modal-overlay">
          <div className="status-modal">
            <div className="modal-header">
              <h3>Confirm Status Change</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="status-change-summary">
                <p>You are about to change the job status to:</p>
                <div 
                  className="new-status-badge"
                  style={{ backgroundColor: getStatusColor(selectedTransition.status) }}
                >
                  {selectedTransition.label}
                </div>
                <p className="status-description">{selectedTransition.description}</p>
              </div>

              {/* Reason field for rejections and cancellations */}
              {(['rejected', 'cancelled', 'disputed'].includes(selectedTransition.status)) && (
                <div className="form-group">
                  <label htmlFor="reason">
                    Reason {(['rejected', 'cancelled'].includes(selectedTransition.status)) ? '(Required)' : '(Optional)'}:
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Please provide a reason for ${selectedTransition.status}...`}
                    rows={3}
                    required={['rejected', 'cancelled'].includes(selectedTransition.status)}
                  />
                </div>
              )}

              {/* Estimated completion date for in_progress status */}
              {selectedTransition.status === 'in_progress' && (
                <div className="form-group">
                  <label htmlFor="completion-date">Estimated Completion Date (Optional):</label>
                  <input
                    type="datetime-local"
                    id="completion-date"
                    value={estimatedCompletionDate}
                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              {/* Delivery notes for completed status */}
              {selectedTransition.status === 'completed' && (
                <div className="form-group">
                  <label htmlFor="delivery-notes">Delivery Notes (Optional):</label>
                  <textarea
                    id="delivery-notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Describe what was delivered or completed..."
                    rows={3}
                  />
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmStatusChange}
                style={{ backgroundColor: getStatusColor(selectedTransition.status) }}
              >
                Confirm {selectedTransition.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobStatusManager; 