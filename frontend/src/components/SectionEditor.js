import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SectionEditor.css';

const SectionEditor = ({ 
  section, 
  sectionIndex, 
  documentId, 
  documentType,
  onSectionRefined 
}) => {
  const [isRefining, setIsRefining] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedback();
    fetchComments();
  }, [documentId, sectionIndex]);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/feedback`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setFeedback(response.data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/comments`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      setError('Please enter refinement instructions');
      return;
    }

    setIsRefining(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/refine`,
        {
          refinement_instruction: refinementPrompt
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setRefinementPrompt('');
      setShowRefineInput(false);
      onSectionRefined(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to refine section');
    } finally {
      setIsRefining(false);
    }
  };

  const handleFeedback = async (feedbackType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/feedback`,
        { feedback_type: feedbackType },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setFeedback({ feedback_type: feedbackType });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/comments`,
        { comment_text: newComment },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/documents/${documentId}/sections/${sectionIndex}/comments/${commentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const renderContent = () => {
    if (documentType === 'docx') {
      return <p className="section-content">{section.content}</p>;
    } else {
      // PowerPoint slides with bullet points
      return (
        <ul className="slide-content">
          {Array.isArray(section.content) ? (
            section.content.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))
          ) : (
            <li>{section.content}</li>
          )}
        </ul>
      );
    }
  };

  return (
    <div className="section-editor">
      <div className="section-header">
        <h3>{section.title}</h3>
        <div className="section-actions">
          <button
            className="btn-icon btn-refine"
            onClick={() => setShowRefineInput(!showRefineInput)}
            title="Refine this section"
          >
            ✏️
          </button>
          <button
            className="btn-icon btn-comments"
            onClick={() => setShowComments(!showComments)}
            title="View comments"
          >
            💬 {comments.length > 0 && `(${comments.length})`}
          </button>
        </div>
      </div>

      <div className="section-body">
        {renderContent()}
      </div>

      {showRefineInput && (
        <div className="refine-box">
          <textarea
            className="refine-input"
            placeholder="E.g., 'Make this more formal', 'Convert to bullet points', 'Shorten to 100 words'"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            rows={2}
            disabled={isRefining}
          />
          <div className="refine-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRefine}
              disabled={isRefining || !refinementPrompt.trim()}
            >
              {isRefining ? 'Refining...' : 'Apply Refinement'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowRefineInput(false);
                setRefinementPrompt('');
                setError('');
              }}
              disabled={isRefining}
            >
              Cancel
            </button>
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>
      )}

      <div className="section-footer">
        <div className="feedback-buttons">
          <button
            className={`btn-feedback ${feedback?.feedback_type === 'like' ? 'active' : ''}`}
            onClick={() => handleFeedback('like')}
            title="I like this section"
          >
            👍 Like
          </button>
          <button
            className={`btn-feedback ${feedback?.feedback_type === 'dislike' ? 'active' : ''}`}
            onClick={() => handleFeedback('dislike')}
            title="I dislike this section"
          >
            👎 Dislike
          </button>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <h4>Comments</h4>
          
          <div className="comment-input-box">
            <textarea
              className="comment-input"
              placeholder="Add a note or comment about this section..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Add Comment
            </button>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    <button
                      className="btn-delete-comment"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="comment-text">{comment.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
