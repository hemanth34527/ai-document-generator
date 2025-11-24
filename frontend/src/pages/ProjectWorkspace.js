import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StructureEditor from '../components/StructureEditor';
import ContentViewer from '../components/ContentViewer';
import RefineModal from '../components/RefineModal';
import './ProjectWorkspace.css';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('configure'); // configure, generate, refine, export

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/documents/projects/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProject(response.data.project);
      setDocuments(response.data.documents);
      
      if (response.data.documents.length > 0) {
        setCurrentDocument(response.data.documents[0]);
        setStep('refine');
      }
    } catch (err) {
      setError('Failed to load project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStructureUpdate = async (structure) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/documents/projects/${id}`,
        { structure },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProject({ ...project, structure });
    } catch (err) {
      setError('Failed to update structure');
    }
  };

  const handleGenerate = async (additionalContext = '') => {
    setGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/projects/${id}/generate`,
        {
          structure: project.structure,
          context: additionalContext
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setDocuments([response.data, ...documents]);
      setCurrentDocument(response.data);
      setStep('refine');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (refinementInstruction) => {
    setGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/projects/${id}/refine`,
        {
          document_id: currentDocument.id,
          refinement_instruction: refinementInstruction
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setDocuments([response.data, ...documents]);
      setCurrentDocument(response.data);
      setShowRefineModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to refine content');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!currentDocument) {
      alert('No document to export');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/documents/${currentDocument.id}/export`,
        { 
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.title}.${project.document_type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export document');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="container">
          <div className="header-content">
            <div>
              <button onClick={() => navigate('/dashboard')} className="btn-back">
                ← Back to Dashboard
              </button>
              <h1>{project.title}</h1>
              <span className="document-type">
                {project.document_type === 'docx' ? '📄 Word Document' : '📊 PowerPoint'}
              </span>
            </div>
            <div className="header-actions">
              {currentDocument && (
                <button onClick={handleExport} className="btn btn-success">
                  📥 Export {project.document_type.toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="workspace-content container">
        <div className="workflow-steps">
          <div className={`step ${step === 'configure' ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span>Configure</span>
          </div>
          <div className={`step ${step === 'generate' || step === 'refine' ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span>Generate</span>
          </div>
          <div className={`step ${step === 'refine' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Refine</span>
          </div>
          <div className={`step ${currentDocument ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span>Export</span>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="workspace-grid">
          <div className="workspace-panel">
            <h2>Document Structure</h2>
            <StructureEditor
              documentType={project.document_type}
              structure={project.structure}
              onUpdate={handleStructureUpdate}
              disabled={generating}
            />
            
            <div className="generate-section">
              <h3>Generate Content</h3>
              <button
                onClick={() => handleGenerate()}
                className="btn btn-primary btn-full"
                disabled={generating || !project.structure}
              >
                {generating ? 'Generating...' : '✨ Generate with AI'}
              </button>
              {!project.structure && (
                <p className="hint">Please define the document structure first</p>
              )}
            </div>
          </div>

          <div className="workspace-panel">
            <div className="content-header">
              <h2>Generated Content</h2>
              {currentDocument && (
                <div className="version-selector">
                  <label>Version:</label>
                  <select
                    value={currentDocument.id}
                    onChange={(e) => {
                      const doc = documents.find(d => d.id === parseInt(e.target.value));
                      setCurrentDocument(doc);
                    }}
                  >
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        v{doc.version} - {new Date(doc.created_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {currentDocument ? (
              <>
                <ContentViewer
                  content={currentDocument.content}
                  documentType={project.document_type}
                  documentId={currentDocument.id}
                  onContentUpdate={(updatedDoc) => {
                    setDocuments([updatedDoc, ...documents]);
                    setCurrentDocument(updatedDoc);
                  }}
                />
                
                <div className="refine-actions">
                  <button
                    onClick={() => setShowRefineModal(true)}
                    className="btn btn-primary"
                    disabled={generating}
                  >
                    🔄 Refine Entire Document
                  </button>
                  <button
                    onClick={handleExport}
                    className="btn btn-success"
                  >
                    📥 Export Document
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-content">
                <p>No content generated yet.</p>
                <p>Define your document structure and click "Generate with AI" to create content.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRefineModal && (
        <RefineModal
          onRefine={handleRefine}
          onClose={() => setShowRefineModal(false)}
          loading={generating}
        />
      )}
    </div>
  );
};

export default ProjectWorkspace;
