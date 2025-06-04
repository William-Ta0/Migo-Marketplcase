import React, { useState, useRef, useEffect } from "react";

const JobMessaging = ({ job, currentUser, onMessageSend }) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [job.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await onMessageSend(newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return `Yesterday ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getMessageSender = (message) => {
    // Check if sender is current user
    const isCurrentUser =
      message.sender._id === currentUser?.uid ||
      message.sender.firebaseUid === currentUser?.uid;

    if (isCurrentUser) {
      return "You";
    }

    return message.sender.name || "Unknown User";
  };

  const isCurrentUserMessage = (message) => {
    return (
      message.sender._id === currentUser?.uid ||
      message.sender.firebaseUid === currentUser?.uid
    );
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case "status_update":
        return "🔄";
      case "system":
        return "⚙️";
      default:
        return "💬";
    }
  };

  const getMessageTypeClass = (type) => {
    switch (type) {
      case "status_update":
        return "status-update";
      case "system":
        return "system-message";
      default:
        return "regular-message";
    }
  };

  return (
    <div className="job-messaging">
      <div className="messaging-container">
        {/* Messages Header */}
        <div className="messages-header">
          <h3>Messages</h3>
          <p>{job.messages?.length || 0} messages</p>
        </div>

        {/* Messages List */}
        <div className="messages-list">
          {job.messages && job.messages.length > 0 ? (
            job.messages.map((message, index) => (
              <div
                key={index}
                className={`message-item ${getMessageTypeClass(message.type)} ${
                  isCurrentUserMessage(message)
                    ? "own-message"
                    : "other-message"
                }`}
              >
                <div className="message-header">
                  <div className="message-sender">
                    <span className="message-type-icon">
                      {getMessageTypeIcon(message.type)}
                    </span>
                    <span className="sender-name">
                      {getMessageSender(message)}
                    </span>
                  </div>
                  <div className="message-timestamp">
                    {formatMessageDate(message.timestamp)}
                  </div>
                </div>

                <div className="message-content">
                  <p>{message.message}</p>
                </div>

                {message.type === "status_update" && (
                  <div className="status-update-badge">Status Update</div>
                )}
              </div>
            ))
          ) : (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h4>No messages yet</h4>
              <p>Start the conversation by sending a message below.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="message-input-section">
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-container">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={3}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <span className="sending-indicator">
                    <div className="spinner"></div>
                    Sending...
                  </span>
                ) : (
                  <span>
                    Send
                    <svg
                      className="send-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
            <div className="input-help">
              <small>Press Enter to send, Shift+Enter for new line</small>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h4>Quick Messages</h4>
          <div className="quick-actions-grid">
            <button
              className="quick-action-btn"
              style={{ color: 'black' }}
              onClick={() =>
                setNewMessage(
                  "Could you please provide an update on the progress?"
                )
              }
              disabled={sending}
            >
              Request Update
            </button>
            <button
              className="quick-action-btn"
              style={{ color: 'black' }}
              onClick={() =>
                setNewMessage(
                  "Thank you for the update. Everything looks good!"
                )
              }
              disabled={sending}
            >
              Acknowledge
            </button>
            <button
              className="quick-action-btn"
              style={{ color: 'black' }}
              onClick={() =>
                setNewMessage("I have a question about the requirements...")
              }
              disabled={sending}
            >
              Ask Question
            </button>
            <button
              className="quick-action-btn"
              style={{ color: 'black' }}
              onClick={() =>
                setNewMessage("When can we schedule a call to discuss this?")
              }
              disabled={sending}
            >
              Schedule Call
            </button>
          </div>
        </div>

        {/* Message Guidelines */}
        <div className="message-guidelines">
          <h4>Communication Guidelines</h4>
          <ul>
            <li>Keep messages professional and relevant to the job</li>
            <li>Be specific when asking questions or requesting updates</li>
            <li>Respond promptly to maintain good communication</li>
            <li>Use status updates for important milestone changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobMessaging;
