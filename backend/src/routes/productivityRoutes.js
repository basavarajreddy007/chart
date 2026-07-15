const { Router } = require('express');
const prodController = require('../controllers/productivityController');
const authenticateJWT = require('../middleware/auth');

const router = Router();

router.use(authenticateJWT);

router.post('/', prodController.createWorkspace);
router.get('/', prodController.getWorkspaces);
router.post('/:workspaceId/invite', prodController.inviteMember);

router.get('/:workspaceId/tasks', prodController.getTasks);
router.post('/:workspaceId/tasks', prodController.createTask);
router.put('/tasks/:taskId', prodController.updateTask);

router.get('/:workspaceId/notes', prodController.getNotes);
router.post('/:workspaceId/notes', prodController.createNote);
router.put('/notes/:noteId', prodController.updateNote);

router.put('/:workspaceId/whiteboard', prodController.updateWhiteboard);
router.get('/:workspaceId/whiteboard', prodController.getWhiteboard);

module.exports = router;
