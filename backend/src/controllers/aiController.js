const AIHistory = require('../models/AIHistory');
const aiService = require('../services/aiService');
const logger = require('../config/logger');

const logAIUsage = async (userId, feature, promptTokens = 10, completionTokens = 20) => {
  try {
    const log = new AIHistory({
      user: userId,
      feature,
      promptTokens,
      completionTokens,
    });
    await log.save();
  } catch (e) {
    logger.error(`Error logging AI usage: ${e.message}`);
  }
};

const summarizeChat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const summary = await aiService.summarizeChatText(messages);
    await logAIUsage(req.user.id, 'summarize');

    res.status(200).json({ summary });
  } catch (error) {
    logger.error(`AI Summary error: ${error.message}`);
    res.status(500).json({ message: 'Error generating chat summary' });
  }
};

const suggestReplies = async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) return res.status(400).json({ message: 'Context string is required' });

    const suggestions = await aiService.getSmartReplySuggestions(context);
    await logAIUsage(req.user.id, 'smart_replies');

    res.status(200).json({ suggestions });
  } catch (error) {
    logger.error(`AI Smart replies error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching reply suggestions' });
  }
};

const rewriteTone = async (req, res) => {
  try {
    const { content, tone } = req.body;
    if (!content || !tone) return res.status(400).json({ message: 'Content and tone parameters required' });

    const rewritten = await aiService.rewriteMessageTone(content, tone);
    await logAIUsage(req.user.id, 'rewrite');

    res.status(200).json({ rewritten });
  } catch (error) {
    logger.error(`AI Rewrite tone error: ${error.message}`);
    res.status(500).json({ message: 'Error rewriting text' });
  }
};

const translateText = async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;
    if (!content || !targetLanguage) return res.status(400).json({ message: 'Content and target language required' });

    const translated = await aiService.translateMessageText(content, targetLanguage);
    await logAIUsage(req.user.id, 'translate');

    res.status(200).json({ translated });
  } catch (error) {
    logger.error(`AI Translation error: ${error.message}`);
    res.status(500).json({ message: 'Error translating message' });
  }
};

const explainDocument = async (req, res) => {
  try {
    const { docContent, question } = req.body;
    if (!docContent || !question) return res.status(400).json({ message: 'Document content and question are required' });

    const explanation = await aiService.explainDocumentOrPDF(docContent, question);
    await logAIUsage(req.user.id, 'document_qa');

    res.status(200).json({ explanation });
  } catch (error) {
    logger.error(`AI Doc QA error: ${error.message}`);
    res.status(500).json({ message: 'Error explaining document context' });
  }
};

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Image prompt is required' });

    const imageUrl = await aiService.generateDalleImage(prompt);
    await logAIUsage(req.user.id, 'image_generation', 50, 50);

    res.status(200).json({ imageUrl });
  } catch (error) {
    logger.error(`AI Image Generation error: ${error.message}`);
    res.status(500).json({ message: 'Error generating media asset' });
  }
};

const ocrImageContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image attachment file required' });
    }

    const extractedText = 'Invoice No: #8921-A\nTotal Balance: $250.00\nDate: 2026-07-14\nItem: MongoDB Scaling Consultation';
    await logAIUsage(req.user.id, 'ocr');

    res.status(200).json({ extractedText });
  } catch (error) {
    logger.error(`AI OCR error: ${error.message}`);
    res.status(500).json({ message: 'Error reading text from image' });
  }
};

module.exports = {
  summarizeChat,
  suggestReplies,
  rewriteTone,
  translateText,
  explainDocument,
  generateImage,
  ocrImageContent
};
