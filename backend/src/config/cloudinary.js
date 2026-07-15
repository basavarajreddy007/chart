const { v2: cloudinary } = require('cloudinary');
const logger = require('./logger');

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'mock' &&
  process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'mock' &&
  process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET !== 'mock';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary not configured. Uploads will fallback to local folder storage.');
}

const uploadToCloudinary = async (fileBuffer, folderName) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary not configured. Use local disk handler.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const getCloudinaryStatus = () => !!isCloudinaryConfigured;

module.exports = {
  cloudinary,
  uploadToCloudinary,
  getCloudinaryStatus
};
