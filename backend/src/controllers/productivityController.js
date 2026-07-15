const Workspace = require('../models/Workspace');
const Chat = require('../models/Chat');
const Task = require('../models/Task');
const Note = require('../models/Note');
const logger = require('../config/logger');

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Workspace name is required' });

    const defaultChat = new Chat({
      type: 'group',
      name: `${name} General`,
      description: `Default text channel for ${name}`,
      participants: [req.user.id],
      admins: [req.user.id],
    });
    await defaultChat.save();

    const workspace = new Workspace({
      name,
      description: description || '',
      owner: req.user.id,
      members: [req.user.id],
      channels: [defaultChat._id],
    });
    await workspace.save();

    res.status(201).json(workspace);
  } catch (error) {
    logger.error(`Create workspace error: ${error.message}`);
    res.status(500).json({ message: 'Error creating workspace' });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id })
      .populate('members', 'username displayName avatar email isOnline')
      .populate('channels');
    res.status(200).json(workspaces);
  } catch (error) {
    logger.error(`Get workspaces error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving workspaces' });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { memberId } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only workspace owners can add members' });
    }

    if (workspace.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    workspace.members.push(memberId);
    await workspace.save();

    await Chat.updateMany(
      { _id: { $in: workspace.channels } },
      { $addToSet: { participants: memberId } }
    );

    res.status(200).json({ message: 'Member added to workspace successfully' });
  } catch (error) {
    logger.error(`Invite workspace member error: ${error.message}`);
    res.status(500).json({ message: 'Error inviting workspace member' });
  }
};

const createTask = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, priority, dueDate, assignee } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required' });

    const task = new Task({
      workspace: workspaceId,
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignee: assignee || null,
    });
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    logger.error(`Create task error: ${error.message}`);
    res.status(500).json({ message: 'Error creating workspace task' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const tasks = await Task.find({ workspace: workspaceId })
      .populate('assignee', 'username displayName avatar');
    res.status(200).json(tasks);
  } catch (error) {
    logger.error(`Get tasks error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, priority, assignee, title, description } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    logger.error(`Update task error: ${error.message}`);
    res.status(500).json({ message: 'Error updating task status' });
  }
};

const createNote = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;

    const note = new Note({
      workspace: workspaceId,
      title: title || 'Untitled Note',
      content: '',
      lastUpdatedBy: req.user.id,
    });
    await note.save();

    res.status(201).json(note);
  } catch (error) {
    logger.error(`Create note error: ${error.message}`);
    res.status(500).json({ message: 'Error creating workspace document' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const notes = await Note.find({ workspace: workspaceId })
      .populate('lastUpdatedBy', 'username displayName');
    res.status(200).json(notes);
  } catch (error) {
    logger.error(`Get notes error: ${error.message}`);
    res.status(500).json({ message: 'Error loading notes list' });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    note.lastUpdatedBy = req.user.id;

    await note.save();
    res.status(200).json(note);
  } catch (error) {
    logger.error(`Update note error: ${error.message}`);
    res.status(500).json({ message: 'Error saving note contents' });
  }
};

const getWhiteboard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).select('whiteboardData');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.status(200).json({ whiteboardData: workspace.whiteboardData || null });
  } catch (error) {
    logger.error(`Get whiteboard error: ${error.message}`);
    res.status(500).json({ message: 'Error loading whiteboard' });
  }
};

const updateWhiteboard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { whiteboardData } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    workspace.whiteboardData = whiteboardData;
    await workspace.save();

    res.status(200).json({ message: 'Whiteboard updated successfully' });
  } catch (error) {
    logger.error(`Update whiteboard error: ${error.message}`);
    res.status(500).json({ message: 'Error saving whiteboard' });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  inviteMember,
  createTask,
  getTasks,
  updateTask,
  createNote,
  getNotes,
  updateNote,
  getWhiteboard,
  updateWhiteboard
};
