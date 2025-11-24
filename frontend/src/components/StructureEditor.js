import React, { useState, useEffect } from 'react';
import './StructureEditor.css';

const StructureEditor = ({ documentType, structure, onUpdate, disabled }) => {
  const [localStructure, setLocalStructure] = useState(
    structure || {
      title: '',
      description: '',
      [documentType === 'docx' ? 'sections' : 'slides']: []
    }
  );

  useEffect(() => {
    if (structure) {
      setLocalStructure(structure);
    }
  }, [structure]);

  const handleTitleChange = (e) => {
    setLocalStructure({ ...localStructure, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setLocalStructure({ ...localStructure, description: e.target.value });
  };

  const handleAddItem = () => {
    const key = documentType === 'docx' ? 'sections' : 'slides';
    const newItem = { title: '', description: '' };
    setLocalStructure({
      ...localStructure,
      [key]: [...(localStructure[key] || []), newItem]
    });
  };

  const handleItemChange = (index, field, value) => {
    const key = documentType === 'docx' ? 'sections' : 'slides';
    const items = [...localStructure[key]];
    items[index] = { ...items[index], [field]: value };
    setLocalStructure({ ...localStructure, [key]: items });
  };

  const handleRemoveItem = (index) => {
    const key = documentType === 'docx' ? 'sections' : 'slides';
    const items = localStructure[key].filter((_, i) => i !== index);
    setLocalStructure({ ...localStructure, [key]: items });
  };

  const handleSave = () => {
    onUpdate(localStructure);
  };

  const itemKey = documentType === 'docx' ? 'sections' : 'slides';
  const itemLabel = documentType === 'docx' ? 'Section' : 'Slide';

  return (
    <div className="structure-editor">
      <div className="input-group">
        <label>Document Title</label>
        <input
          type="text"
          value={localStructure.title}
          onChange={handleTitleChange}
          placeholder="Enter document title..."
          disabled={disabled}
        />
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={localStructure.description}
          onChange={handleDescriptionChange}
          placeholder="Brief description of the document..."
          disabled={disabled}
        />
      </div>

      <div className="items-section">
        <div className="items-header">
          <h3>{itemLabel}s</h3>
          <button
            onClick={handleAddItem}
            className="btn btn-secondary btn-sm"
            disabled={disabled}
          >
            + Add {itemLabel}
          </button>
        </div>

        {localStructure[itemKey]?.map((item, index) => (
          <div key={index} className="structure-item">
            <div className="item-header">
              <span className="item-number">{index + 1}</span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="btn-remove"
                disabled={disabled}
              >
                ×
              </button>
            </div>
            <div className="input-group">
              <label>{itemLabel} Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                placeholder={`${itemLabel} title...`}
                disabled={disabled}
              />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder={`What should this ${itemLabel.toLowerCase()} cover?`}
                disabled={disabled}
                rows="2"
              />
            </div>
          </div>
        ))}

        {(!localStructure[itemKey] || localStructure[itemKey].length === 0) && (
          <div className="empty-items">
            <p>No {itemLabel.toLowerCase()}s added yet. Click "Add {itemLabel}" to start.</p>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className="btn btn-primary btn-full"
        disabled={disabled}
      >
        Save Structure
      </button>
    </div>
  );
};

export default StructureEditor;
