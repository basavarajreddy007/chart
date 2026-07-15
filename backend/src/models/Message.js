const { Schema, model } = require('mongoose');

const MessageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    iv: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'media', 'voice', 'file', 'poll', 'system'],
      default: 'text',
    },
    fileDetails: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      fileName: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      mimeType: { type: String, default: '' },
    },
    pollDetails: {
      question: { type: String, default: '' },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
      isClosed: { type: Boolean, default: false },
    },
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true },
      },
    ],
    starredBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: { type: String },
        editedAt: { type: Date, default: Date.now },
      },
    ],
    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ content: 'text' });

const Message = model('Message', MessageSchema);

module.exports = Message;
