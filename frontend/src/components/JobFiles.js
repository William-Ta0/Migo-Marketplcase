import React, { useState } from 'react';

const JobFiles = ({ job, isVendor, isCustomer, onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || uploading) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      await onFileUpload(file);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type) => {
    const fileType = type?.toLowerCase() || '';
    
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    return '📎';
  };

  const formatUploadDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="job-files">
      <div className="files-container">
        {/* Upload Section */}
        <div className="upload-section">
          <h3>Upload Files</h3>
          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="upload-progress">
                <div className="spinner"></div>
                <p>Uploading file...</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <h4>Drop files here or click to upload</h4>
                <p>Supports images, documents, and files up to 10MB</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-input"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                  disabled={uploading}
                />
                <button className="upload-btn">
                  Choose File
                </button>
              </>
            )}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="attachments-section">
          <h3>Attachments ({job.attachments?.length || 0})</h3>
          {job.attachments && job.attachments.length > 0 ? (
            <div className="files-grid">
              {job.attachments.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-header">
                    <div className="file-icon">
                      {getFileTypeIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span className="file-size">
                          {formatFileSize(file.size || 0)}
                        </span>
                        <span className="upload-date">
                          {formatUploadDate(file.uploadedAt)}
                        </span>
                      </div>
                      <div className="uploaded-by">
                        Uploaded by: {file.uploadedBy?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="file-actions">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-files">
              <div className="no-files-icon">📎</div>
              <p>No files uploaded yet</p>
            </div>
          )}
        </div>

        {/* Deliverables Section */}
        <div className="deliverables-section">
          <h3>Deliverables</h3>
          <div className="deliverables-grid">
            {/* Expected Deliverables */}
            <div className="expected-deliverables">
              <h4>Expected Deliverables</h4>
              {job.deliverables && job.deliverables.length > 0 ? (
                <ul className="deliverables-list">
                  {job.deliverables.map((deliverable, index) => (
                    <li key={index} className="deliverable-item">
                      <span className="deliverable-text">{deliverable}</span>
                      <span className="deliverable-status pending">Pending</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-deliverables">No specific deliverables defined</p>
              )}
            </div>

            {/* Completed Deliverables */}
            <div className="completed-deliverables">
              <h4>Completed Deliverables</h4>
              {job.completedDeliverables && job.completedDeliverables.length > 0 ? (
                <div className="completed-list">
                  {job.completedDeliverables.map((deliverable, index) => (
                    <div key={index} className="completed-item">
                      <div className="completed-header">
                        <span className="completed-name">{deliverable.name}</span>
                        <span className="completed-date">
                          {formatUploadDate(deliverable.completedAt)}
                        </span>
                      </div>
                      {deliverable.description && (
                        <div className="completed-description">
                          {deliverable.description}
                        </div>
                      )}
                      {deliverable.files && deliverable.files.length > 0 && (
                        <div className="completed-files">
                          {deliverable.files.map((file, fileIndex) => (
                            <a 
                              key={fileIndex}
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="completed-file-link"
                            >
                              {getFileTypeIcon(file.type)} {file.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-completed">No deliverables completed yet</p>
              )}
            </div>
          </div>
        </div>

        {/* File Guidelines */}
        <div className="file-guidelines">
          <h4>File Upload Guidelines</h4>
          <ul>
            <li>Maximum file size: 10MB</li>
            <li>Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX)</li>
            <li>Files are securely stored and only accessible to job participants</li>
            <li>Use descriptive file names for better organization</li>
            <li>Upload progress updates and deliverables promptly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobFiles; 