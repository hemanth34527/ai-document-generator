import React, { useState } from 'react';
import './RefineModal.css';

const RefineModal = ({ onRefine, onClose, loading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (instruction.trim()) {
      onRefine(instruction);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal refine-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Refine Content</h2>
        <p className="modal-description">
          Tell the AI how you'd like to improve the content. Be specific about what changes you want.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Refinement Instructions</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Example: Make the tone more professional, add more details to section 2, shorten the conclusion..."
              rows="6"
              required
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !instruction.trim()}
            >
              {loading ? 'Refining...' : 'Refine Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefineModal;
