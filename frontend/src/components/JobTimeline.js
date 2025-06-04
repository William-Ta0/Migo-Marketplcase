import React, { useState, useEffect } from "react";
import { getJobTimeline } from "../api/jobApi";
import "../styles/JobTimeline.css";

const JobTimeline = ({ jobId, job }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, status, messages, files

  useEffect(() => {
    fetchTimeline();
  }, [jobId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await getJobTimeline(jobId);
      if (response.success) {
        setTimeline(response.data.timeline);
      } else {
        // Generate timeline from job data if API fails
        generateTimelineFromJob();
      }
    } catch (err) {
      // Generate timeline from job data if API fails
      generateTimelineFromJob();
      console.error(
        "Timeline API not available, using generated timeline:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTimelineFromJob = () => {
    if (!job) {
      setTimeline([]);
      return;
    }

    const generatedTimeline = [];

    // Add job creation event
    generatedTimeline.push({
      id: "created",
      type: "status_change",
      newStatus: "pending",
      reason: "Job created",
      timestamp: job.createdAt,
      actor: "customer",
      description: "Job was created and submitted for review",
    });

    // Add current status if different from pending
    if (job.status !== "pending") {
      generatedTimeline.push({
        id: "current_status",
        type: "status_change",
        newStatus: job.status,
        reason: "Status updated",
        timestamp: job.updatedAt || job.createdAt,
        actor: "vendor",
        description: `Job status changed to ${job.status.replace("_", " ")}`,
      });
    }

    // Add messages if available
    if (job.messages && job.messages.length > 0) {
      job.messages.forEach((message, index) => {
        generatedTimeline.push({
          id: `message_${index}`,
          type: "message",
          content: message.content || message.message,
          timestamp: message.createdAt || message.timestamp,
          actor: message.sender?.role || message.actor || "user",
          description: "Message sent",
        });
      });
    }

    // Sort by timestamp (newest first)
    generatedTimeline.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    setTimeline(generatedTimeline);
    setError(""); // Clear any previous errors
  };

  const getEventIcon = (type, status) => {
    const icons = {
      status_change: {
        pending: "⏳",
        reviewing: "🔍",
        quoted: "💰",
        accepted: "✅",
        confirmed: "🎯",
        in_progress: "🔄",
        completed: "✨",
        delivered: "📦",
        cancelled: "❌",
        disputed: "⚠️",
        closed: "🏁",
      },
      message: "💬",
      file_upload: "📎",
      payment: "💳",
      review: "⭐",
      milestone: "🎯",
    };

    if (type === "status_change" && status) {
      return icons.status_change[status] || "🔄";
    }
    return icons[type] || "📋";
  };

  const getEventColor = (type, status) => {
    const colors = {
      status_change: {
        pending: "#f59e0b",
        reviewing: "#3b82f6",
        quoted: "#8b5cf6",
        accepted: "#10b981",
        confirmed: "#059669",
        in_progress: "#0ea5e9",
        completed: "#22c55e",
        delivered: "#16a34a",
        cancelled: "#ef4444",
        disputed: "#dc2626",
        closed: "#6b7280",
      },
      message: "#6366f1",
      file_upload: "#8b5cf6",
      payment: "#059669",
      review: "#f59e0b",
      milestone: "#10b981",
    };

    if (type === "status_change" && status) {
      return colors.status_change[status] || "#6b7280";
    }
    return colors[type] || "#6b7280";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 2) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getEventTitle = (event) => {
    const titles = {
      status_change: `Status changed to ${event.newStatus
        ?.replace("_", " ")
        .toUpperCase()}`,
      message:
        event.actor === "customer"
          ? "You sent a message"
          : "Vendor sent a message",
      file_upload:
        event.actor === "customer"
          ? "You uploaded a file"
          : "Vendor uploaded a file",
      payment: "Payment processed",
      review: "Review submitted",
      milestone: "Milestone reached",
    };

    return titles[event.type] || "Activity";
  };

  const getEventDescription = (event) => {
    switch (event.type) {
      case "status_change":
        return event.reason || "Status updated automatically";
      case "message":
        return event.content || "Message sent";
      case "file_upload":
        return event.filename || "File uploaded";
      case "payment":
        return `Payment of ${event.amount} processed`;
      case "review":
        return `${event.rating} star review: ${event.comment}`;
      case "milestone":
        return event.description || "Milestone completed";
      default:
        return event.description || "";
    }
  };

  const filteredTimeline = timeline.filter((event) => {
    if (filter === "all") return true;
    if (filter === "status") return event.type === "status_change";
    if (filter === "messages") return event.type === "message";
    if (filter === "files") return event.type === "file_upload";
    return true;
  });

  const getProgressPercentage = () => {
    if (!job) return 0;

    // Updated to match simplified workflow
    const progressMap = {
      'pending': 25,
      'accepted': 75,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[job.status] || 0;

  };

  const getNextMilestone = () => {
    if (!job) return null;
    // Updated to match simplified workflow
    const milestones = {

      'pending': 'Vendor decision',
      'accepted': 'Work completion',
      'completed': 'Job finished',
      'cancelled': 'Job cancelled'

    };
    return milestones[job.status] || null;
  };

  if (loading) {
    return (
      <div className="job-timeline">
        <div className="timeline-loading">
          <div className="loading-spinner"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-timeline">
        <div className="timeline-error">
          <p>{error}</p>
          <button onClick={fetchTimeline} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-timeline">
      <div className="timeline-header">
        <h3>Job Timeline</h3>
        <div className="timeline-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({timeline.length})
          </button>
          <button
            className={`filter-btn ${filter === "status" ? "active" : ""}`}
            onClick={() => setFilter("status")}
          >
            Status ({timeline.filter((e) => e.type === "status_change").length})
          </button>
          <button
            className={`filter-btn ${filter === "messages" ? "active" : ""}`}
            onClick={() => setFilter("messages")}
          >
            Messages ({timeline.filter((e) => e.type === "message").length})
          </button>
          <button
            className={`filter-btn ${filter === "files" ? "active" : ""}`}
            onClick={() => setFilter("files")}
          >
            Files ({timeline.filter((e) => e.type === "file_upload").length})
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      {job && (
        <div className="progress-overview">
          <div className="progress-header">
            <h4>Progress Overview</h4>
            <span className="progress-percentage">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getEventColor("status_change", job.status),
                }}
              ></div>
            </div>
            {getNextMilestone() && (
              <div className="next-milestone">Next: {getNextMilestone()}</div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="timeline-container">
        {filteredTimeline.length === 0 ? (
          <div className="no-timeline-events">
            <div className="no-events-icon">📋</div>
            <p>No {filter === "all" ? "" : filter} events yet</p>
          </div>
        ) : (
          <div className="timeline-events">
            {filteredTimeline.map((event, index) => (
              <div
                key={event._id || index}
                className={`timeline-event ${event.type}`}
              >
                <div className="event-line">
                  <div
                    className="event-dot"
                    style={{
                      backgroundColor: getEventColor(
                        event.type,
                        event.newStatus
                      ),
                    }}
                  >
                    <span className="event-icon">
                      {getEventIcon(event.type, event.newStatus)}
                    </span>
                  </div>
                  {index < filteredTimeline.length - 1 && (
                    <div className="event-connector"></div>
                  )}
                </div>

                <div className="event-content">
                  <div className="event-header">
                    <h4 className="event-title">{getEventTitle(event)}</h4>
                    <span className="event-time">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>

                  <div className="event-body">
                    <p className="event-description">
                      {getEventDescription(event)}
                    </p>

                    {event.actor && (
                      <div className="event-actor">
                        <span className="actor-label">by</span>
                        <span className="actor-name">
                          {event.actor === "customer"
                            ? "You"
                            : event.actorName || "Vendor"}
                        </span>
                      </div>
                    )}

                    {event.metadata && (
                      <div className="event-metadata">
                        {event.metadata.estimatedCompletion && (
                          <div className="metadata-item">
                            <span className="metadata-label">
                              Est. Completion:
                            </span>
                            <span className="metadata-value">
                              {formatDate(event.metadata.estimatedCompletion)}
                            </span>
                          </div>
                        )}
                        {event.metadata.fileSize && (
                          <div className="metadata-item">
                            <span className="metadata-label">File Size:</span>
                            <span className="metadata-value">
                              {(event.metadata.fileSize / 1024 / 1024).toFixed(
                                2
                              )}{" "}
                              MB
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Stats */}
      <div className="timeline-stats">
        <div className="stat-item">
          <span className="stat-label">Total Events:</span>
          <span className="stat-value">{timeline.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Duration:</span>
          <span className="stat-value">
            {job &&
              Math.ceil(
                (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24)
              )}{" "}
            days
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Activity:</span>
          <span className="stat-value">
            {timeline.length > 0 ? formatDate(timeline[0].timestamp) : "None"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JobTimeline;
