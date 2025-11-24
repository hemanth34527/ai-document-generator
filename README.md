# AI-Assisted Document Authoring and Generation Platform

A full-stack web application that allows authenticated users to generate, refine, and export structured business documents using AI with an advanced editor-style interface.

## Features

- **User Authentication**: Secure JWT-based authentication with registration and login
- **Document Types**: Support for Microsoft Word (.docx) and PowerPoint (.pptx) documents
- **AI-Powered Generation**: Uses Google Gemini 2.5 Flash API for intelligent content creation
- **Section-Level Editing**: Interactive editor interface for each section/slide with:
  - AI Refinement Prompts (e.g., "Make this more formal", "Convert to bullet points")
  - Like/Dislike feedback buttons for user satisfaction tracking
  - Comment boxes for notes (stored in database)
- **Document-Level Refinement**: Option to refine entire documents at once
- **Version Control**: Track all document versions, refinements, and changes
- **Persistent Data**: All revisions, prompts, comments, and feedback stored in PostgreSQL
- **Export**: Download final documents in native .docx and .pptx formats
- **IST Timezone**: All timestamps displayed in Indian Standard Time

## Tech Stack

### Backend
- Flask 3.0.0 (Python web framework)
- PostgreSQL (Database with IST timezone support)
- SQLAlchemy (ORM)
- Google Gemini API 2.5 Flash (Large Language Model)
- python-docx 1.1.0 & python-pptx 0.6.23 (Document generation)
- Flask-JWT-Extended 4.6.0 (Authentication)
- Flask-CORS 4.0.0 (Cross-origin requests)

### Frontend
- React 18 (UI framework)
- React Router (Navigation)
- Axios (HTTP client)
- Context API (State management)

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL 12 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python -m venv .venv
source .venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ocean_ai_db

# JWT Secret Key (generate a random string)
SECRET_KEY=your-secret-key-here-make-it-long-and-random

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Flask Configuration
FLASK_ENV=development
```

**Environment Variable Descriptions:**

- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database_name`
  - Example: `postgresql://postgres:admin@localhost:5432/ocean_ai_db`

- `SECRET_KEY`: Secret key for JWT token encryption
  - Use a long, random string for security
  - Generate using: `python -c "import secrets; print(secrets.token_hex(32))"`

- `GEMINI_API_KEY`: Your Google Gemini API key
  - Get from: https://makersuite.google.com/app/apikey

- `FLASK_ENV`: Environment mode (development/production)

### Database Setup

1. **Create PostgreSQL database:**

**Windows (PowerShell):**
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ocean_ai_db;

# Exit psql
\q
```

**Linux/Mac:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ocean_ai_db;

# Exit psql
\q
```

2. **Initialize database tables:**
```bash
python init_db.py
```

You should see: ✓ Database tables created successfully!

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file in `frontend` directory:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## How to Run the Application

### Method 1: Using Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```
Backend will run on: http://localhost:5000

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```
Frontend will run on: http://localhost:3000

### Method 2: Using Batch Files (Windows Only)

**Backend:**
```bash
cd backend
start.bat
```

**Frontend:**
```bash
cd frontend
start.bat
```

### Access the Application

Open your browser and navigate to: **http://localhost:3000**

**Demo Account:**
- Username: `demo`
- Password: `demo123`

Or create your own account using the registration page.

## Usage Guide

### 1. User Registration & Login

1. Navigate to http://localhost:3000
2. Click "Register" to create a new account
3. Fill in username, email, and password
4. Login with your credentials

### 2. Configuring a Word Document

1. Click "New Project" from the dashboard
2. Enter project title (e.g., "Business Proposal")
3. Select "Word Document" as document type
4. Define document structure:
   - Add sections with titles and descriptions
   - Example sections: "Executive Summary", "Project Overview", "Timeline"
5. Click "Create Project"

### 3. Configuring a PowerPoint Document

1. Click "New Project" from the dashboard
2. Enter project title (e.g., "Quarterly Review")
3. Select "PowerPoint Presentation" as document type
4. Define slide structure:
   - Add slides with titles
   - Example slides: "Introduction", "Key Metrics", "Action Items"
5. Click "Create Project"

### 4. Content Generation

1. Open your project from the dashboard
2. Review the document structure on the left panel
3. (Optional) Add additional context for AI generation
4. Click "✨ Generate with AI" button
5. Wait for AI to generate content (typically 10-30 seconds)
6. Generated content appears on the right panel

### 5. Refinement Features

#### **Section-Level Refinement:**

For each section/slide, you can:

**A. AI Refinement Prompt:**
1. Click the ✏️ (edit) icon on any section
2. Enter refinement instruction in the textbox:
   - "Make this more formal"
   - "Convert to bullet points"
   - "Shorten to 100 words"
   - "Add more technical details"
3. Click "Apply Refinement"
4. New version created with only that section refined

**B. Feedback Buttons:**
1. Click 👍 "Like" if you're satisfied with the section
2. Click 👎 "Dislike" if you want to improve it
3. Feedback is saved in the database for tracking

**C. Comments:**
1. Click 💬 (comments) icon to view comment section
2. Add notes like "Need to verify these numbers" or "Great content!"
3. Comments are stored in database with timestamps
4. Delete comments by clicking 🗑️ icon

#### **Document-Level Refinement:**

1. Click "🔄 Refine Entire Document" button
2. Enter overall refinement instructions
3. AI refines all sections together while maintaining consistency
4. New document version created

### 6. Version Control

1. Use the "Version" dropdown to view previous versions
2. Each refinement creates a new version
3. Versions are numbered (v1, v2, v3, etc.)
4. All versions stored with IST timestamps

### 7. Exporting Documents

#### **Export .docx (Word) Files:**
1. Click "📥 Export Document" button
2. Word document downloads with all sections formatted
3. File includes:
   - Document title
   - All section headings
   - Formatted paragraphs

#### **Export .pptx (PowerPoint) Files:**
1. Click "📥 Export Document" button
2. PowerPoint presentation downloads with all slides
3. File includes:
   - Title slide
   - All slides with titles and bullet points
   - Professional formatting

## Project Structure

```
Ocean AI/
├── backend/
│   ├── app.py                  # Flask application entry point
│   ├── config.py               # Configuration settings
│   ├── models.py               # Database models (User, Project, Document, SectionFeedback, SectionComment)
│   ├── init_db.py              # Database initialization script
│   ├── requirements.txt        # Python dependencies
│   ├── routes/
│   │   ├── auth.py            # Authentication routes
│   │   └── documents.py       # Document & section management routes
│   └── services/
│       ├── llm_service.py     # Google Gemini API integration
│       └── document_service.py # Document generation (.docx/.pptx)
│
├── frontend/
│   ├── package.json           # Node.js dependencies
│   ├── public/
│   │   └── index.html         # HTML template
│   └── src/
│       ├── App.js             # Main application component
│       ├── index.js           # React entry point
│       ├── components/
│       │   ├── StructureEditor.js    # Document structure configuration
│       │   ├── ContentViewer.js      # Display generated content
│       │   ├── SectionEditor.js      # Section-level editor with refinement/feedback/comments
│       │   └── RefineModal.js        # Document-level refinement modal
│       ├── context/
│       │   └── AuthContext.js        # Authentication state management
│       └── pages/
│           ├── Login.js              # Login page
│           ├── Register.js           # Registration page
│           ├── Dashboard.js          # Project dashboard
│           └── ProjectWorkspace.js   # Main document editing workspace
│
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token

### Projects
- `GET /api/documents/projects` - Get all user projects
- `POST /api/documents/projects` - Create new project
- `GET /api/documents/projects/:id` - Get project with documents
- `PUT /api/documents/projects/:id` - Update project structure
- `DELETE /api/documents/projects/:id` - Delete project

### Documents
- `POST /api/documents/projects/:id/generate` - Generate document content
- `POST /api/documents/projects/:id/refine` - Refine entire document
- `GET /api/documents/:id/export` - Export document as .docx or .pptx

### Section Operations
- `POST /api/documents/:id/sections/:index/refine` - Refine specific section
- `POST /api/documents/:id/sections/:index/feedback` - Add like/dislike feedback
- `GET /api/documents/:id/sections/:index/feedback` - Get section feedback
- `POST /api/documents/:id/sections/:index/comments` - Add comment to section
- `GET /api/documents/:id/sections/:index/comments` - Get section comments
- `DELETE /api/documents/:id/sections/:index/comments/:commentId` - Delete comment

## Database Schema

### Tables

**users**
- id (Primary Key)
- username (Unique)
- email (Unique)
- password_hash
- created_at (IST)

**projects**
- id (Primary Key)
- user_id (Foreign Key → users)
- title
- document_type (docx/pptx)
- structure (JSON)
- created_at (IST)
- updated_at (IST)

**documents**
- id (Primary Key)
- project_id (Foreign Key → projects)
- content (JSON)
- version
- created_at (IST)

**section_feedbacks**
- id (Primary Key)
- document_id (Foreign Key → documents)
- section_index
- feedback_type (like/dislike)
- created_at (IST)

**section_comments**
- id (Primary Key)
- document_id (Foreign Key → documents)
- section_index
- comment_text
- created_at (IST)

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```
Error: could not connect to server
```
**Solution:** Ensure PostgreSQL is running and credentials in `.env` are correct.

**Module Not Found Error:**
```
ModuleNotFoundError: No module named 'flask'
```
**Solution:** Activate virtual environment and run `pip install -r requirements.txt`

**Gemini API Error:**
```
Error: Invalid API key
```
**Solution:** Verify your `GEMINI_API_KEY` in `.env` file is correct.

### Frontend Issues

**Cannot Connect to Backend:**
```
Network Error
```
**Solution:** Ensure backend is running on http://localhost:5000

**Module Not Found:**
```
Cannot find module 'axios'
```
**Solution:** Run `npm install` in the frontend directory

## Features Demonstrated

✅ User registration & login with JWT authentication  
✅ Configuring Word document structure  
✅ Configuring PowerPoint presentation structure  
✅ AI-powered content generation using Gemini 2.5 Flash  
✅ Section-level refinement with custom prompts  
✅ Like/Dislike feedback for sections  
✅ Adding and managing comments on sections  
✅ Document-level refinement  
✅ Version control and history  
✅ Exporting to .docx and .pptx formats  
✅ IST timezone for all timestamps  

## Demo Video

[Upload your demo video here - 5-10 minutes showing the features above]

## License

This project is created for educational purposes.

## Support

For issues or questions, please check the troubleshooting section or review the code comments in the source files.
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create `.env` file from example:
```bash
cp .env.example .env
```

6. Update `.env` with your configuration:
```
DATABASE_URL=postgresql://username:password@localhost:5432/ocean_ai_db
JWT_SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
```

7. Create PostgreSQL database:
```sql
CREATE DATABASE ocean_ai_db;
```

8. Run the application:
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or sign in
2. **Create Project**: Click "New Project" and select document type (Word/PowerPoint)
3. **Configure Structure**: Define sections/slides and their descriptions
4. **Generate Content**: Let AI create initial content based on your structure
5. **Refine**: Iteratively improve the content with specific instructions
6. **Export**: Download the final document in .docx or .pptx format

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents/projects` - List all projects
- `POST /api/documents/projects` - Create new project
- `GET /api/documents/projects/:id` - Get project details
- `PUT /api/documents/projects/:id` - Update project
- `DELETE /api/documents/projects/:id` - Delete project
- `POST /api/documents/projects/:id/generate` - Generate content
- `POST /api/documents/projects/:id/refine` - Refine content
- `GET /api/documents/:id/export` - Export document

## Project Structure

```
Ocean AI/
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   └── documents.py
│   ├── services/
│   │   ├── llm_service.py
│   │   └── document_service.py
│   ├── app.py
│   ├── config.py
│   ├── models.py
│   └── requirements.txt
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── ContentViewer.js
    │   │   ├── RefineModal.js
    │   │   └── StructureEditor.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Dashboard.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── ProjectWorkspace.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## License

This project is private and confidential.
