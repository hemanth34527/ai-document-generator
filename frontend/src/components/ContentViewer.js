import React from 'react';
import SectionEditor from './SectionEditor';
import './ContentViewer.css';

const ContentViewer = ({ content, documentType, documentId, onContentUpdate }) => {
  if (!content) {
    return <div className="empty-content">No content available</div>;
  }

  const handleSectionRefined = (updatedDocument) => {
    // Notify parent component to update the document
    if (onContentUpdate) {
      onContentUpdate(updatedDocument);
    }
  };

  if (documentType === 'docx') {
    return (
      <div className="content-viewer docx-viewer">
        <h2 className="document-title">{content.title}</h2>
        {content.sections?.map((section, index) => (
          <SectionEditor
            key={index}
            section={section}
            sectionIndex={index}
            documentId={documentId}
            documentType={documentType}
            onSectionRefined={handleSectionRefined}
          />
        ))}
      </div>
    );
  } else {
    // PowerPoint presentation
    return (
      <div className="content-viewer pptx-viewer">
        <div className="presentation-title-slide">
          <h2>{content.title}</h2>
        </div>
        {content.slides?.map((slide, index) => (
          <SectionEditor
            key={index}
            section={slide}
            sectionIndex={index}
            documentId={documentId}
            documentType={documentType}
            onSectionRefined={handleSectionRefined}
          />
        ))}
      </div>
    );
  }
};

export default ContentViewer;
