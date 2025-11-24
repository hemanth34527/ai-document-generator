from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
import json

db = SQLAlchemy()

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_time():
    """Get current time in IST"""
    return datetime.now(IST)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=get_ist_time)
    
    projects = db.relationship('Project', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.String(20), nullable=False)  # 'docx' or 'pptx'
    structure = db.Column(db.Text, nullable=True)  # JSON string of document structure
    created_at = db.Column(db.DateTime, default=get_ist_time)
    updated_at = db.Column(db.DateTime, default=get_ist_time, onupdate=get_ist_time)
    
    documents = db.relationship('Document', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def get_structure(self):
        return json.loads(self.structure) if self.structure else None
    
    def set_structure(self, structure_dict):
        self.structure = json.dumps(structure_dict)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'document_type': self.document_type,
            'structure': self.get_structure(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)  # JSON string of document content
    version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=get_ist_time)
    
    section_feedbacks = db.relationship('SectionFeedback', backref='document', lazy=True, cascade='all, delete-orphan')
    section_comments = db.relationship('SectionComment', backref='document', lazy=True, cascade='all, delete-orphan')
    
    def get_content(self):
        return json.loads(self.content) if self.content else None
    
    def set_content(self, content_dict):
        self.content = json.dumps(content_dict)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'content': self.get_content(),
            'version': self.version,
            'created_at': self.created_at.isoformat()
        }

class SectionFeedback(db.Model):
    __tablename__ = 'section_feedbacks'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    section_index = db.Column(db.Integer, nullable=False)  # Index of section in document
    feedback_type = db.Column(db.String(10), nullable=False)  # 'like' or 'dislike'
    created_at = db.Column(db.DateTime, default=get_ist_time)
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'section_index': self.section_index,
            'feedback_type': self.feedback_type,
            'created_at': self.created_at.isoformat()
        }

class SectionComment(db.Model):
    __tablename__ = 'section_comments'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    section_index = db.Column(db.Integer, nullable=False)  # Index of section in document
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=get_ist_time)
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'section_index': self.section_index,
            'comment_text': self.comment_text,
            'created_at': self.created_at.isoformat()
        }
