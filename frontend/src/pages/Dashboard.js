import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    document_type: 'docx'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/documents/projects`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/documents/projects`, 
        newProject,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setShowModal(false);
      setNewProject({ title: '', document_type: 'docx' });
      navigate(`/project/${response.data.id}`);
    } catch (err) {
      console.error('Create project error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/documents/projects/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>AI-Assisted Document Authoring and Generation Platform</h1>
            <div className="header-actions">
              <span className="user-name">Welcome, {user?.username}!</span>
              <button onClick={logout} className="btn btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="projects-header">
          <h2>My Projects</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first AI-powered document</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Get Started
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-icon">
                  {project.document_type === 'docx' ? '📄' : '📊'}
                </div>
                <h3>{project.title}</h3>
                <p className="project-type">
                  {project.document_type === 'docx' ? 'Word Document' : 'PowerPoint Presentation'}
                </p>
                <p className="project-date">
                  Updated: {new Date(project.updated_at).toLocaleDateString()}
                </p>
                <div className="project-actions">
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="btn btn-primary"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="input-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  required
                  placeholder="Enter project title..."
                />
              </div>

              <div className="input-group">
                <label>Document Type</label>
                <select
                  value={newProject.document_type}
                  onChange={(e) => setNewProject({...newProject, document_type: e.target.value})}
                >
                  <option value="docx">Word Document (.docx)</option>
                  <option value="pptx">PowerPoint Presentation (.pptx)</option>
                </select>
              </div>

              {error && <div className="error">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
