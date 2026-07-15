const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { saveFile } = require('../services/cloudinaryService');
const logger = require('../config/logger');

const createChat = async (req, res) => {
  try {
    const { type, participantId, name, description, participants } = req.body;
    
    if (type === 'direct') {
      if (!participantId) {
        return res.status(400).json({ message: 'Participant ID is required for direct chats' });
      }

      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: { $all: [req.user.id, participantId] },
      }).populate('participants', 'username displayName avatar email isOnline e2ePublicKey');

      if (existingChat) {
        return res.status(200).json(existingChat);
      }

      const chat = new Chat({
        type: 'direct',
        participants: [req.user.id, participantId],
      });
      await chat.save();
      const populatedChat = await Chat.findById(chat._id).populate('participants', 'username displayName avatar email isOnline e2ePublicKey');
      return res.status(201).json(populatedChat);
    }

    if (type === 'group') {
      if (!name || !participants || !Array.isArray(participants)) {
        return res.status(400).json({ message: 'Group name and participants list are required' });
      }

      const allParticipants = [...new Set([...participants, req.user.id])];
      const chat = new Chat({
        type: 'group',
        name,
        description: description || '',
        participants: allParticipants,
        admins: [req.user.id],
      });
      await chat.save();
      const populatedChat = await Chat.findById(chat._id).populate('participants', 'username displayName avatar email isOnline e2ePublicKey');
      
      const io = req.app.get('io');
      if (io) {
        allParticipants.forEach(pId => {
          if (pId !== req.user.id) {
            io.to(`user:${pId}`).emit('chat:new_group', populatedChat);
          }
        });
      }

      return res.status(201).json(populatedChat);
    }

    res.status(400).json({ message: 'Invalid chat type specified' });
  } catch (error) {
    logger.error(`Create chat error: ${error.message}`);
    res.status(500).json({ message: 'Error creating chat conversation' });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'username displayName avatar email isOnline e2ePublicKey lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName' },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    logger.error(`Get chats error: ${error.message}`);
    res.status(500).json({ message: 'Error loading chats list' });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 40 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({
      chat: chatId,
      deletedBy: { $ne: req.user.id },
    })
      .populate('sender', 'username displayName avatar e2ePublicKey')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username displayName' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json(messages.reverse());
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving chat history' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType, pollDetails, replyTo, isEncrypted, iv } = req.body;
    
    let fileDetails = undefined;

    if (req.file) {
      const secureUrl = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileDetails = {
        url: secureUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };
    }

    const message = new Message({
      chat: chatId,
      sender: req.user.id,
      content: content || (fileDetails ? fileDetails.fileName : ''),
      messageType: messageType || (req.file ? 'file' : 'text'),
      fileDetails,
      pollDetails: pollDetails ? JSON.parse(pollDetails) : undefined,
      replyTo: replyTo || null,
      isEncrypted: isEncrypted === 'true' || isEncrypted === true,
      iv: iv || '',
    });

    await message.save();

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar e2ePublicKey')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username displayName' },
      });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('message:new', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(500).json({ message: 'Error sending message' });
  }
};

const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;

    const message = await Message.findById(messageId);
    if (!message || message.messageType !== 'poll') {
      return res.status(404).json({ message: 'Poll message not found' });
    }

    message.pollDetails.options.forEach((opt) => {
      opt.votes = opt.votes.filter((vId) => vId.toString() !== req.user.id);
    });

    message.pollDetails.options[optionIndex].votes.push(req.user.id);
    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate('sender', 'username displayName avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat.toString()}`).emit('poll:update', populatedMessage);
    }

    res.status(200).json(populatedMessage);
  } catch (error) {
    logger.error(`Vote poll error: ${error.message}`);
    res.status(500).json({ message: 'Error recording vote' });
  }
};

const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user.id);
    
    message.reactions.push({ user: req.user.id, emoji });
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat.toString()}`).emit('message:reaction', {
        messageId,
        reactions: message.reactions,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    logger.error(`Reaction error: ${error.message}`);
    res.status(500).json({ message: 'Error adding reaction' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { mode } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (mode === 'everyone') {
      if (message.sender.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own messages for everyone' });
      }
      message.deletedForEveryone = true;
      message.content = 'This message was deleted.';
      message.fileDetails = undefined;
      await message.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`chat:${message.chat.toString()}`).emit('message:delete', { messageId });
      }
    } else {
      message.deletedBy.push(req.user.id);
      await message.save();
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error(`Delete message error: ${error.message}`);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatMessages,
  sendMessage,
  votePoll,
  addReaction,
  deleteMessage
};
