import cloudinary from '../config/cloudinary.js';

export const uploadImage = async (fileBuffer, folder = 'lost2found/items') => {
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
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image from Cloudinary (publicId: ${publicId}):`, error);
  }
};
