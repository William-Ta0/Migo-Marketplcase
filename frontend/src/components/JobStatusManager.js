import React, { useState } from 'react';

const JobStatusManager = ({ job, isVendor, isCustomer, onStatusUpdate }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const getAvailableActions = () => {
    const actions = [];

    if (job.status === 'pending') {
      if (isVendor) {
        actions.push({
          status: 'accepted',
          label: 'Accept Job',
          description: 'Accept this job request and begin work',
          color: '#10b981',
          buttonClass: 'btn-success'
        });
        actions.push({
          status: 'cancelled',
          label: 'Cancel Job',
          description: 'Cancel this job request',
          color: '#ef4444',
          buttonClass: 'btn-danger',
          requiresReason: true
        });
      }
      if (isCustomer) {
        actions.push({
          status: 'cancelled',
          label: 'Cancel Request',
          description: 'Cancel this job request',
          color: '#ef4444',
          buttonClass: 'btn-danger',
          requiresReason: true
        });
      }
    }

    if (job.status === 'accepted') {
      if (isCustomer) {
        actions.push({
          status: 'completed',
          label: 'Confirm Work Done',
          description: 'Confirm that the work has been completed satisfactorily',
          color: '#22c55e',
          buttonClass: 'btn-success'
        });
        actions.push({
          status: 'cancelled',
          label: 'Cancel Job',
          description: 'Cancel this job (if needed)',
          color: '#ef4444',
          buttonClass: 'btn-danger',
          requiresReason: true
        });
      }
    }

    return actions;
  };

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowStatusModal(true);
    setReason('');
    setError('');
  };

  const confirmAction = async () => {
    try {
      setError('');
      
      // Validation
      if (selectedAction.requiresReason && !reason.trim()) {
        setError('Please provide a reason for this action');
        return;
      }

      await onStatusUpdate(selectedAction.status, reason.trim());
      setShowStatusModal(false);
      setSelectedAction(null);
    } catch (err) {
      setError('Failed to update status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',       // Orange
      'accepted': '#10b981',      // Green
      'cancelled': '#ef4444',     // Red
      'completed': '#22c55e'      // Success Green
    };
    return colors[status] || '#6b7280';
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'pending': isVendor ? 'Customer is waiting for your response' : 'Waiting for vendor to accept your request',
      'accepted': isVendor ? 'You have accepted this job. Please complete the work.' : 'Vendor has accepted your request. You can confirm when work is done.',
      'cancelled': 'This job has been cancelled',
      'completed': 'This job has been completed successfully'
    };
    return descriptions[status] || '';
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

  const availableActions = getAvailableActions();

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
              {job.status.toUpperCase()}
            </div>
            <div className="status-details">
              <p>{getStatusDescription(job.status)}</p>
            </div>
          </div>
        </div>

        {/* Available Actions */}
        <div className="available-actions-card">
          <h3>Available Actions</h3>
          {availableActions.length > 0 ? (
            <div className="actions-grid">
              {availableActions.map((action, index) => (
                <button
                  key={index}
                  className={`action-btn ${action.buttonClass}`}
                  onClick={() => handleActionClick(action)}
                >
                  <div className="action-label">{action.label}</div>
                  <div className="action-description">{action.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-actions">
              <p>No actions available at this time.</p>
              <small>
                {job.status === 'completed' || job.status === 'cancelled'
                  ? 'This job has been finalized.'
                  : job.status === 'pending' && isCustomer
                  ? 'Please wait for the vendor to respond.'
                  : job.status === 'accepted' && isVendor
                  ? 'Please complete the work. Customer will confirm when done.'
                  : 'Please wait for the other party to take action.'
                }
              </small>
            </div>
          )}
        </div>

        {/* Job Progress Information */}
        <div className="progress-metrics-card">
          <h3>Job Progress</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <label>Created:</label>
              <span>{formatDate(job.createdAt)}</span>
            </div>
            
            {job.status === 'accepted' && (
              <div className="metric-item">
                <label>Accepted:</label>
                <span>{formatDate(job.updatedAt)}</span>
              </div>
            )}
            
            {job.status === 'completed' && (
              <div className="metric-item">
                <label>Completed:</label>
                <span>{formatDate(job.updatedAt)}</span>
              </div>
            )}
            
            <div className="metric-item">
              <label>Total Value:</label>
              <span>{new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(job.pricing?.amount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedAction && (
        <div className="modal-overlay">
          <div className="status-modal">
            <div className="modal-header">
              <h3>{selectedAction.label}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="status-change-summary">
                <p>Are you sure you want to {selectedAction.label.toLowerCase()}?</p>
                <div 
                  className="new-status-badge"
                  style={{ backgroundColor: selectedAction.color }}
                >
                  {selectedAction.status.toUpperCase()}
                </div>
                <p className="status-description">{selectedAction.description}</p>
              </div>

              {selectedAction.requiresReason && (
                <div className="form-group">
                  <label htmlFor="reason">Reason (Required):</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for this action..."
                    rows={3}
                  />
                </div>
              )}

              {error && (
                <div className="error-message">{error}</div>
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
                className={`btn ${selectedAction.buttonClass}`}
                onClick={confirmAction}
              >
                Confirm {selectedAction.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobStatusManager; 