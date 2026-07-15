const { Router } = require('express');
const aiController = require('../controllers/aiController');
const authenticateJWT = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(authenticateJWT);

router.post('/summarize', aiController.summarizeChat);
router.post('/suggest-replies', aiController.suggestReplies);
router.post('/rewrite', aiController.rewriteTone);
router.post('/translate', aiController.translateText);
router.post('/explain-document', aiController.explainDocument);
router.post('/generate-image', aiController.generateImage);
router.post('/ocr', upload.single('file'), aiController.ocrImageContent);

module.exports = router;
