const { Schema, model } = require('mongoose');

const ReportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Report = model('Report', ReportSchema);

module.exports = Report;
