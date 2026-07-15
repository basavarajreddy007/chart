const { Schema, model } = require('mongoose');

const AIHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      enum: [
        'summarize',
        'translate',
        'rewrite',
        'document_qa',
        'ocr',
        'image_generation',
        'speech_to_text',
        'text_to_speech',
        'sentiment_analysis',
        'spam_scam_detection',
        'smart_replies',
      ],
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const AIHistory = model('AIHistory', AIHistorySchema);

module.exports = AIHistory;
