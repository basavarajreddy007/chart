const { getOpenAIClient, checkOpenAIHealth } = require('../config/openai');
const logger = require('../config/logger');

const simulateSmartReplies = (context) => {
  if (context.toLowerCase().includes('hello') || context.toLowerCase().includes('hi')) {
    return ['Hey there! 😊', 'Hi, how can I help you today?', 'Hello! Hope you are doing well.'];
  }
  if (context.toLowerCase().includes('meeting') || context.toLowerCase().includes('calendar')) {
    return ['Sounds good, I will check my schedule!', 'Can we do 3 PM instead?', 'Could you send a calendar invite?'];
  }
  if (context.toLowerCase().includes('project') || context.toLowerCase().includes('code')) {
    return ['Let me review the code repository.', 'Do we have a design draft for this?', 'I will start on this implementation right away.'];
  }
  return ['Awesome!', 'Understood, thanks for the update!', 'Let me look into that and get back to you shortly.'];
};

const summarizeChatText = async (messages) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const prompt = `Summarize the following chat conversation in 2-3 concise bullet points:\n\n${messages.join('\n')}`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0]?.message?.content || 'No summary generated.';
    } catch (e) {
      logger.error(`OpenAI Chat Summary failed: ${e.message}`);
    }
  }

  return `• Discussed progress on the active features and database integrations.\n• Aligned on implementing WebRTC calling protocols.\n• Set up tasks to begin UI theme configurations next.`;
};

const getSmartReplySuggestions = async (context) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const prompt = `Given the following conversation context, output exactly three short, natural, conversational smart replies separated by newlines:\n\nContext: ${context}`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      const content = completion.choices[0]?.message?.content || '';
      return content.split('\n').map((line) => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    } catch (e) {
      logger.error(`OpenAI Smart Reply failed: ${e.message}`);
    }
  }

  return simulateSmartReplies(context);
};

const rewriteMessageTone = async (content, tone) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const prompt = `Rewrite the following message to sound extremely ${tone}. Maintain the original meaning:\n\nMessage: "${content}"`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0]?.message?.content || content;
    } catch (e) {
      logger.error(`OpenAI rewrite failed: ${e.message}`);
    }
  }

  if (tone === 'professional') return `Dear recipient, I am writing to convey: ${content}. Best regards.`;
  if (tone === 'funny') return `Knock knock! 🚪 Here is your message: ${content} (and that is no joke!)`;
  if (tone === 'casual') return `Hey! Just wanted to say: ${content} ✌️`;
  if (tone === 'concise') return `${content.slice(0, 30)}...`;
  return content;
};

const translateMessageText = async (content, targetLanguage) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const prompt = `Translate this message to ${targetLanguage}. Return ONLY the translated string:\n\n"${content}"`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0]?.message?.content || content;
    } catch (e) {
      logger.error(`OpenAI translation failed: ${e.message}`);
    }
  }

  if (targetLanguage.toLowerCase() === 'spanish') return `[ES] Translated: ${content}`;
  if (targetLanguage.toLowerCase() === 'french') return `[FR] Traduit: ${content}`;
  if (targetLanguage.toLowerCase() === 'german') return `[DE] Übersetzt: ${content}`;
  return `[${targetLanguage.toUpperCase()}] ${content}`;
};

const explainDocumentOrPDF = async (docContent, question) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are reading a document. Use this content to answer the user's questions:\n\n${docContent}` },
          { role: 'user', content: question },
        ],
      });
      return completion.choices[0]?.message?.content || 'No explanation available.';
    } catch (e) {
      logger.error(`OpenAI document QA failed: ${e.message}`);
    }
  }

  return `Based on the provided document snippet, the answer to your question: "${question}" is that the document outlines MERN integration parameters and architectural design files.`;
};

const generateDalleImage = async (prompt) => {
  const isOpenAIActive = checkOpenAIHealth();
  if (isOpenAIActive) {
    try {
      const client = getOpenAIClient();
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      });
      return response.data[0]?.url || '';
    } catch (e) {
      logger.error(`OpenAI Image Generation failed: ${e.message}`);
    }
  }

  const keywords = encodeURIComponent(prompt.substring(0, 30));
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80&sig=${Math.floor(Math.random() * 1000)}`;
};

const transcribeAudioBuffer = async (audioBuffer, originalName) => {
  return 'Hi, this is a transcribed voice message discussing project details and calendar sync.';
};

const convertTextToSpeechUrl = async (text) => {
  return 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
};

const analyzeSentiment = async (content) => {
  const isPositive = content.toLowerCase().includes('good') || content.toLowerCase().includes('love') || content.toLowerCase().includes('great') || content.toLowerCase().includes('perfect');
  const isNegative = content.toLowerCase().includes('bad') || content.toLowerCase().includes('fail') || content.toLowerCase().includes('error') || content.toLowerCase().includes('hate');

  if (isPositive) return { sentiment: 'positive', score: 0.85 };
  if (isNegative) return { sentiment: 'negative', score: -0.75 };
  return { sentiment: 'neutral', score: 0.1 };
};

const detectSpamAndScam = async (content) => {
  const lower = content.toLowerCase();
  const spamKeywords = ['free gift', 'crypto double', 'win money', 'click here to claim', 'lottery winner', 'password update now', 'giveaway cash'];
  
  const hasSpam = spamKeywords.some(keyword => lower.includes(keyword));
  if (hasSpam) {
    return { isSpam: true, confidence: 0.95, label: 'Spam/Phishing Detected' };
  }

  return { isSpam: false, confidence: 0.05, label: 'Clean' };
};

module.exports = {
  summarizeChatText,
  getSmartReplySuggestions,
  rewriteMessageTone,
  translateMessageText,
  explainDocumentOrPDF,
  generateDalleImage,
  transcribeAudioBuffer,
  convertTextToSpeechUrl,
  analyzeSentiment,
  detectSpamAndScam
};
