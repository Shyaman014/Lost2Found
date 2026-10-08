import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = async (fileBuffer, folder = 'lost2found/items') => {
  // Check if Cloudinary is actually configured, otherwise fallback to local filesystem
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes('your_cloudinary')) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const filePath = path.join(uploadDir, uniqueName);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return {
      url: `${baseUrl}/uploads/${uniqueName}`,
      publicId: `local-${uniqueName}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    // Stream the buffer to Cloudinary
    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;
    
    if (publicId.startsWith('local-')) {
      const filename = publicId.replace('local-', '');
      const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image (publicId: ${publicId}):`, error);
  }
};
