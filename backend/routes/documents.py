from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, Document, SectionFeedback, SectionComment
from services.llm_service import LLMService
from services.document_service import DocumentService
import io

documents_bp = Blueprint('documents', __name__)
llm_service = LLMService()
document_service = DocumentService()

@documents_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = int(get_jwt_identity())
    projects = Project.query.filter_by(user_id=user_id).order_by(Project.updated_at.desc()).all()
    return jsonify([project.to_dict() for project in projects]), 200

@documents_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('document_type'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if data['document_type'] not in ['docx', 'pptx']:
        return jsonify({'error': 'Invalid document type'}), 400
    
    project = Project(
        user_id=user_id,
        title=data['title'],
        document_type=data['document_type']
    )
    
    if data.get('structure'):
        project.set_structure(data['structure'])
    
    db.session.add(project)
    db.session.commit()
    
    return jsonify(project.to_dict()), 201

@documents_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    documents = Document.query.filter_by(project_id=project_id).order_by(Document.version.desc()).all()
    
    return jsonify({
        'project': project.to_dict(),
        'documents': [doc.to_dict() for doc in documents]
    }), 200

@documents_bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    
    if data.get('title'):
        project.title = data['title']
    
    if data.get('structure'):
        project.set_structure(data['structure'])
    
    db.session.commit()
    
    return jsonify(project.to_dict()), 200

@documents_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({'message': 'Project deleted successfully'}), 200

@documents_bp.route('/projects/<int:project_id>/generate', methods=['POST'])
@jwt_required()
def generate_content(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    structure = data.get('structure') or project.get_structure()
    
    if not structure:
        return jsonify({'error': 'No structure defined'}), 400
    
    try:
        generated_content = llm_service.generate_content(
            document_type=project.document_type,
            structure=structure,
            additional_context=data.get('context', '')
        )
        
        # Get latest version number
        latest_doc = Document.query.filter_by(project_id=project_id).order_by(Document.version.desc()).first()
        next_version = (latest_doc.version + 1) if latest_doc else 1
        
        # Create new document version
        document = Document(
            project_id=project_id,
            version=next_version
        )
        document.set_content(generated_content)
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify(document.to_dict()), 201
    
    except Exception as e:
        return jsonify({'error': f'Content generation failed: {str(e)}'}), 500

@documents_bp.route('/projects/<int:project_id>/refine', methods=['POST'])
@jwt_required()
def refine_content(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    
    if not data.get('document_id') or not data.get('refinement_instruction'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    document = Document.query.filter_by(id=data['document_id'], project_id=project_id).first()
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    try:
        refined_content = llm_service.refine_content(
            current_content=document.get_content(),
            refinement_instruction=data['refinement_instruction'],
            document_type=project.document_type
        )
        
        # Create new version with refined content
        new_document = Document(
            project_id=project_id,
            version=document.version + 1
        )
        new_document.set_content(refined_content)
        
        db.session.add(new_document)
        db.session.commit()
        
        return jsonify(new_document.to_dict()), 201
    
    except Exception as e:
        return jsonify({'error': f'Content refinement failed: {str(e)}'}), 500

@documents_bp.route('/<int:document_id>/export', methods=['GET'])
@jwt_required()
def export_document(document_id):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership through project
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    # Verify user owns the project
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    project = document.project
    
    try:
        # Get document content
        content = document.get_content()
        
        if not content:
            return jsonify({'error': 'No content to export'}), 400
        
        file_buffer = io.BytesIO()
        
        # Clean filename - remove special characters
        clean_title = "".join(c for c in project.title if c.isalnum() or c in (' ', '-', '_')).strip()
        if not clean_title:
            clean_title = "document"
        
        if project.document_type == 'docx':
            document_service.create_docx(content, file_buffer)
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            filename = f"{clean_title}.docx"
        else:  # pptx
            document_service.create_pptx(content, file_buffer)
            mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            filename = f"{clean_title}.pptx"
        
        file_buffer.seek(0)
        
        response = send_file(
            file_buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
        
        return response
    
    except Exception as e:
        print(f"Export error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Export failed: {str(e)}'}), 500

# Section-level operations
@documents_bp.route('/<int:document_id>/sections/<int:section_index>/refine', methods=['POST'])
@jwt_required()
def refine_section(document_id, section_index):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data.get('refinement_instruction'):
        return jsonify({'error': 'Missing refinement instruction'}), 400
    
    try:
        current_content = document.get_content()
        
        if not current_content or 'sections' not in current_content:
            return jsonify({'error': 'Invalid document content'}), 400
        
        if section_index >= len(current_content['sections']):
            return jsonify({'error': 'Invalid section index'}), 400
        
        # Refine specific section
        refined_content = llm_service.refine_section(
            current_content=current_content,
            section_index=section_index,
            refinement_instruction=data['refinement_instruction'],
            document_type=document.project.document_type
        )
        
        # Create new version with refined content
        new_document = Document(
            project_id=document.project_id,
            version=document.version + 1
        )
        new_document.set_content(refined_content)
        
        db.session.add(new_document)
        db.session.commit()
        
        return jsonify(new_document.to_dict()), 201
    
    except Exception as e:
        return jsonify({'error': f'Section refinement failed: {str(e)}'}), 500

@documents_bp.route('/<int:document_id>/sections/<int:section_index>/feedback', methods=['POST'])
@jwt_required()
def add_section_feedback(document_id, section_index):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data.get('feedback_type') or data['feedback_type'] not in ['like', 'dislike']:
        return jsonify({'error': 'Invalid feedback type'}), 400
    
    # Remove any existing feedback for this section
    SectionFeedback.query.filter_by(
        document_id=document_id,
        section_index=section_index
    ).delete()
    
    # Add new feedback
    feedback = SectionFeedback(
        document_id=document_id,
        section_index=section_index,
        feedback_type=data['feedback_type']
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    return jsonify(feedback.to_dict()), 201

@documents_bp.route('/<int:document_id>/sections/<int:section_index>/feedback', methods=['GET'])
@jwt_required()
def get_section_feedback(document_id, section_index):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    feedback = SectionFeedback.query.filter_by(
        document_id=document_id,
        section_index=section_index
    ).first()
    
    return jsonify(feedback.to_dict() if feedback else None), 200

@documents_bp.route('/<int:document_id>/sections/<int:section_index>/comments', methods=['POST'])
@jwt_required()
def add_section_comment(document_id, section_index):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data.get('comment_text') or not data['comment_text'].strip():
        return jsonify({'error': 'Comment text is required'}), 400
    
    comment = SectionComment(
        document_id=document_id,
        section_index=section_index,
        comment_text=data['comment_text'].strip()
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify(comment.to_dict()), 201

@documents_bp.route('/<int:document_id>/sections/<int:section_index>/comments', methods=['GET'])
@jwt_required()
def get_section_comments(document_id, section_index):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    comments = SectionComment.query.filter_by(
        document_id=document_id,
        section_index=section_index
    ).order_by(SectionComment.created_at.desc()).all()
    
    return jsonify([comment.to_dict() for comment in comments]), 200

@documents_bp.route('/<int:document_id>/sections/<int:section_index>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_section_comment(document_id, section_index, comment_id):
    user_id = int(get_jwt_identity())
    
    # Get document and verify ownership
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.project.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    comment = SectionComment.query.filter_by(
        id=comment_id,
        document_id=document_id,
        section_index=section_index
    ).first()
    
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    
    db.session.delete(comment)
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted successfully'}), 200

