"""
Text extraction service for contracts.
Supports PDF, DOCX, and image files.
"""
import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_file(file_obj, file_name: str) -> tuple[str, str]:
    """
    Extract text from a file object.
    Returns (extracted_text, file_type)
    """
    file_name_lower = file_name.lower()
    
    if file_name_lower.endswith('.pdf'):
        return extract_from_pdf(file_obj), 'pdf'
    elif file_name_lower.endswith('.docx'):
        return extract_from_docx(file_obj), 'docx'
    elif file_name_lower.endswith('.doc'):
        return extract_from_docx(file_obj), 'doc'
    elif file_name_lower.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
        return extract_from_image(file_obj), 'image'
    elif file_name_lower.endswith('.txt'):
        return file_obj.read().decode('utf-8', errors='replace'), 'txt'
    else:
        # Try PDF first, then DOCX
        try:
            file_obj.seek(0)
            return extract_from_pdf(file_obj), 'pdf'
        except Exception:
            try:
                file_obj.seek(0)
                return extract_from_docx(file_obj), 'docx'
            except Exception:
                return "", 'unknown'


def extract_from_pdf(file_obj) -> str:
    """Extract text from PDF file."""
    text_parts = []
    
    # Try pdfplumber first (better for Arabic)
    try:
        import pdfplumber
        file_obj.seek(0)
        file_bytes = file_obj.read()
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        
        if text_parts:
            return '\n\n'.join(text_parts)
    except Exception as e:
        logger.warning(f"pdfplumber failed: {e}")
    
    # Fallback to PyPDF2
    try:
        import PyPDF2
        file_obj.seek(0)
        reader = PyPDF2.PdfReader(file_obj)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        if text_parts:
            return '\n\n'.join(text_parts)
    except Exception as e:
        logger.warning(f"PyPDF2 failed: {e}")
    
    return ""


def extract_from_docx(file_obj) -> str:
    """Extract text from DOCX file."""
    try:
        from docx import Document
        file_obj.seek(0)
        doc = Document(io.BytesIO(file_obj.read()))
        paragraphs = []
        
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text.strip())
        
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = ' | '.join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
        
        return '\n\n'.join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        return ""


def extract_from_image(file_obj) -> str:
    """Extract text from image using OCR."""
    try:
        import pytesseract
        from PIL import Image
        
        file_obj.seek(0)
        image = Image.open(io.BytesIO(file_obj.read()))
        
        # Try Arabic + English OCR
        text = pytesseract.image_to_string(image, lang='ara+eng')
        if not text.strip():
            # Fallback to English only
            text = pytesseract.image_to_string(image, lang='eng')
        
        return text
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return ""


def detect_language(text: str) -> str:
    """Detect if text is primarily Arabic or English."""
    if not text:
        return 'en'
    
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    total_chars = len([c for c in text if c.isalpha()])
    
    if total_chars == 0:
        return 'en'
    
    arabic_ratio = arabic_chars / total_chars
    return 'ar' if arabic_ratio > 0.3 else 'en'
