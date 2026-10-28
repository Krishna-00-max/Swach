import asyncio
import cloudinary
import cloudinary.uploader
from backend.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

async def upload_to_cloudinary(file_stream, filename: str, role: str, user_id: int) -> str:
    """
    Uploads a file to Cloudinary in a structured way:
    Folder structure: swach/{role}/{user_id}
    Using asyncio.to_thread to make the blocking SDK call asynchronous.
    """
    folder_path = f"swach/{role}/{user_id}"
    
    # Strip extension from public_id to let Cloudinary manage original format
    public_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
    
    # Clean up name from any special characters or spaces
    public_id = "".join(c if c.isalnum() or c in ['-', '_'] else '_' for c in public_id)

    def _sync_upload():
        response = cloudinary.uploader.upload(
            file_stream,
            folder=folder_path,
            public_id=public_id,
            resource_type="auto" # Automatically detect image, video, raw file type
        )
        return response.get("secure_url")

    # Run in a worker thread to keep FastAPI async event loop fully unblocked
    secure_url = await asyncio.to_thread(_sync_upload)
    return secure_url
