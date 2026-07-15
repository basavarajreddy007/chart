const OpenAI = require('openai');
const logger = require('./logger');

const apiKey = process.env.OPENAI_API_KEY;
const isOpenAIConfigured = apiKey && apiKey !== 'mock' && apiKey.length > 0;

let openaiClient = null;

if (isOpenAIConfigured) {
  openaiClient = new OpenAI({ apiKey });
  logger.info('OpenAI client initialized successfully');
} else {
  logger.warn('OpenAI API key not provided or set to mock. Running with smart simulated replies.');
}

const getOpenAIClient = () => {
  return openaiClient;
};

const checkOpenAIHealth = () => !!isOpenAIConfigured;

module.exports = {
  getOpenAIClient,
  checkOpenAIHealth,
  openaiClient
};
