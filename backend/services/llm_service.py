import google.generativeai as genai
from config import Config

class LLMService:
    def __init__(self):
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_content(self, document_type, structure, additional_context=''):
        """Generate document content based on structure and type."""
        
        if document_type == 'docx':
            prompt = self._create_docx_prompt(structure, additional_context)
        else:  # pptx
            prompt = self._create_pptx_prompt(structure, additional_context)
        
        response = self.model.generate_content(prompt)
        
        return self._parse_generated_content(response.text, document_type, structure)
    
    def refine_content(self, current_content, refinement_instruction, document_type):
        """Refine existing content based on user instructions."""
        
        prompt = f"""
You are refining a {document_type.upper()} document. 

Current content:
{self._format_content_for_prompt(current_content)}

User's refinement instruction:
{refinement_instruction}

Please provide the refined content in the same JSON format as the original, incorporating the requested changes.
Return ONLY the JSON object, no additional text.
"""
        
        response = self.model.generate_content(prompt)
        
        return self._parse_generated_content(response.text, document_type, current_content.get('sections', []))
    
    def refine_section(self, current_content, section_index, refinement_instruction, document_type):
        """Refine a specific section while preserving the rest of the document."""
        
        # Determine the content key based on document type
        content_key = 'sections' if document_type == 'docx' else 'slides'
        
        if content_key not in current_content or section_index >= len(current_content[content_key]):
            raise ValueError("Invalid section index")
        
        section = current_content[content_key][section_index]
        
        prompt = f"""
You are refining a specific section/slide in a {document_type.upper()} document.

Current section content:
Title: {section.get('title', 'Untitled')}
Content: {self._format_content_for_prompt(section.get('content', ''))}

User's refinement instruction:
{refinement_instruction}

Please provide the refined section content in the following JSON format:
{{
    "title": "section title (keep original unless asked to change)",
    "content": {"detailed paragraph content" if document_type == 'docx' else '["bullet 1", "bullet 2", ...]'}
}}

Return ONLY the JSON object for this section, no additional text.
"""
        
        response = self.model.generate_content(prompt)
        
        # Parse the refined section
        import json
        refined_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if refined_text.startswith('```'):
            lines = refined_text.split('\n')
            refined_text = '\n'.join(lines[1:-1])
        
        refined_text = refined_text.replace('```json', '').replace('```', '').strip()
        
        try:
            refined_section = json.loads(refined_text)
        except json.JSONDecodeError:
            # Fallback to original section
            refined_section = section
        
        # Create a copy of the current content with the refined section
        refined_content = json.loads(json.dumps(current_content))  # Deep copy
        refined_content[content_key][section_index] = refined_section
        
        return refined_content

    
    def _create_docx_prompt(self, structure, additional_context):
        """Create prompt for Word document generation."""
        
        sections_desc = '\n'.join([f"- {s.get('title', 'Untitled')}: {s.get('description', 'No description')}" 
                                   for s in structure.get('sections', [])])
        
        prompt = f"""
Generate content for a Microsoft Word document with the following specifications:

Title: {structure.get('title', 'Untitled Document')}
Description: {structure.get('description', 'No description provided')}

Sections to include:
{sections_desc}

Additional context: {additional_context}

Generate comprehensive, professional content for each section. Return the content in the following JSON format:
{{
    "title": "document title",
    "sections": [
        {{
            "title": "section title",
            "content": "detailed paragraph content for this section"
        }}
    ]
}}

Return ONLY the JSON object, no additional text or markdown formatting.
"""
        return prompt
    
    def _create_pptx_prompt(self, structure, additional_context):
        """Create prompt for PowerPoint presentation generation."""
        
        slides_desc = '\n'.join([f"- Slide {i+1}: {s.get('title', 'Untitled')}" 
                                 for i, s in enumerate(structure.get('slides', []))])
        
        prompt = f"""
Generate content for a PowerPoint presentation with the following specifications:

Presentation Title: {structure.get('title', 'Untitled Presentation')}
Description: {structure.get('description', 'No description provided')}

Slides to include:
{slides_desc}

Additional context: {additional_context}

Generate engaging, concise content for each slide. Return the content in the following JSON format:
{{
    "title": "presentation title",
    "slides": [
        {{
            "title": "slide title",
            "content": ["bullet point 1", "bullet point 2", "bullet point 3"]
        }}
    ]
}}

Each slide should have 3-5 bullet points. Keep bullet points concise and impactful.
Return ONLY the JSON object, no additional text or markdown formatting.
"""
        return prompt
    
    def _parse_generated_content(self, response_text, document_type, structure_reference):
        """Parse and validate the generated content."""
        import json
        
        # Clean the response text
        response_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
        
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        try:
            content = json.loads(response_text)
            return content
        except json.JSONDecodeError:
            # Fallback: create structured content manually
            if document_type == 'docx':
                return {
                    "title": "Generated Document",
                    "sections": [
                        {
                            "title": section.get('title', f'Section {i+1}'),
                            "content": f"Content for {section.get('title', f'Section {i+1}')}"
                        }
                        for i, section in enumerate(structure_reference)
                    ]
                }
            else:
                return {
                    "title": "Generated Presentation",
                    "slides": [
                        {
                            "title": slide.get('title', f'Slide {i+1}'),
                            "content": ["Key point 1", "Key point 2", "Key point 3"]
                        }
                        for i, slide in enumerate(structure_reference)
                    ]
                }
    
    def _format_content_for_prompt(self, content):
        """Format content dict for inclusion in prompt."""
        import json
        return json.dumps(content, indent=2)
