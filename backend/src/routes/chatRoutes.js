const { Router } = require('express');
const chatController = require('../controllers/chatController');
const authenticateJWT = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(authenticateJWT);

router.post('/', chatController.createChat);
router.get('/', chatController.getChats);
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', upload.single('file'), chatController.sendMessage);
router.post('/messages/:messageId/vote', chatController.votePoll);
router.post('/messages/:messageId/reaction', chatController.addReaction);
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;
