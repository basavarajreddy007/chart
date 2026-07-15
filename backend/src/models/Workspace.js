const { Schema, model } = require('mongoose');

const WorkspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    channels: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
    whiteboardData: {
      type: String,
      default: '[]',
    },
  },
  { timestamps: true }
);

const Workspace = model('Workspace', WorkspaceSchema);

module.exports = Workspace;
