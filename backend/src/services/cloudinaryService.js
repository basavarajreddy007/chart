const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, getCloudinaryStatus } = require('../config/cloudinary');
const logger = require('../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const saveFile = async (fileBuffer, fileName, mimeType) => {
  const isCloudinaryActive = getCloudinaryStatus();

  if (isCloudinaryActive) {
    try {
      const secureUrl = await uploadToCloudinary(fileBuffer, 'chat_media');
      return secureUrl;
    } catch (error) {
      logger.error(`Cloudinary upload failed: ${error.message}. Falling back to disk storage.`);
    }
  }

  const sanitizedFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
  const filePath = path.join(UPLOADS_DIR, sanitizedFileName);
  
  await fs.promises.writeFile(filePath, fileBuffer);
  logger.info(`Saved upload locally to ${filePath}`);

  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  return `${serverUrl}/uploads/${sanitizedFileName}`;
};

module.exports = {
  saveFile
};
