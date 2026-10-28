import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models.document import Document, DocumentType
from backend.models.user import User
from backend.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("")
async def get_documents(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List documents filtered by category."""
    query = select(Document).order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()

    # If category is provided, filter them
    if category:
        filtered = []
        for doc in docs:
            # Map doc_type or foreign key fields to category
            t = doc.doc_type
            if category == "vehicle":
                is_match = (
                    doc.vehicle_id is not None or
                    t in [DocumentType.vehicle_doc, DocumentType.vehicle_rc, DocumentType.vehicle_insurance, DocumentType.vehicle_puc]
                )
            elif category == "employee":
                is_match = (
                    doc.worker_id is not None or
                    t in [DocumentType.employee_doc, DocumentType.driver_license]
                )
            elif category == "gov":
                is_match = (t == DocumentType.gov_order)
            elif category == "media":
                is_match = (t in [DocumentType.route_photo, DocumentType.cctv_image, DocumentType.video])
            else:
                is_match = True
            
            if is_match:
                # Add formatted fields for the frontend
                filtered.append({
                    "id": doc.id,
                    "title": doc.title,
                    "type": doc.doc_type.value,
                    "date": doc.created_at.strftime("%Y-%m-%d") if doc.created_at else datetime.now().strftime("%Y-%m-%d"),
                    "size": "1.5 MB", # Mock size for presentation
                    "category": category,
                    "url": doc.url
                })
        return filtered

    return docs

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a document and store its reference in the database."""
    # Determine DocumentType based on category
    doc_type = DocumentType.other
    if category == "vehicle":
        doc_type = DocumentType.vehicle_doc
    elif category == "employee":
        doc_type = DocumentType.employee_doc
    elif category == "gov":
        doc_type = DocumentType.gov_order
    elif category == "media":
        if file.content_type.startswith("video/"):
            doc_type = DocumentType.video
        else:
            doc_type = DocumentType.route_photo

    # Upload directly to Cloudinary
    try:
        from backend.services.cloudinary_service import upload_to_cloudinary
        url = await upload_to_cloudinary(
            file.file,
            file.filename,
            current_user.role.value,
            current_user.id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file to Cloudinary: {str(e)}"
        )

    # Save reference to DB
    new_doc = Document(
        title=title,
        doc_type=doc_type,
        url=url,
        uploaded_by_id=current_user.id
    )

    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    size_mb = f"{(file.size / (1024 * 1024)):.1f} MB" if hasattr(file, "size") and file.size else "1.5 MB"

    return {
        "id": new_doc.id,
        "title": new_doc.title,
        "type": new_doc.doc_type.value,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "size": size_mb,
        "category": category,
        "url": new_doc.url
    }
