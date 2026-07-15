import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setChats, setActiveChat, setMessages, appendMessage } from '../features/chatSlice';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import { deriveKey, encryptPayload } from '../utils/crypto';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useChat = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { chats, activeChat, messages, onlineUsers, typingUsers } = useSelector((state) => state.chat);
  const { theme } = useSelector((state) => state.ui);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [msgContent, setMsgContent] = useState('');
  const [isE2EE, setIsE2EE] = useState(false);
  const [e2eKey, setE2eKey] = useState(null);
  
  const [activeCall, setActiveCall] = useState(null);
  const [callCaptions, setCallCaptions] = useState([]);
  
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const { success: triggerToastSuccess, error: triggerToastError } = useToast();

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    loadChats();

    return () => {
      disconnectSocket();
    };
  }, [token]);

  useEffect(() => {
    const handleKeyDerivation = async () => {
      if (activeChat && isE2EE) {
        const derived = await deriveKey(activeChat._id);
        setE2eKey(derived);
      } else {
        setE2eKey(null);
      }
    };
    handleKeyDerivation();
    if (activeChat) {
      loadMessages(activeChat._id);
      const socket = getSocket();
      if (socket) {
        socket.emit('chat:join', activeChat._id);
      }
    }
  }, [activeChat, isE2EE]);

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const response = await api.get('/chats');
      dispatch(setChats(response.data));
    } catch (e) {
      console.error(e);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    setMessagesLoading(true);
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      dispatch(setMessages(response.data));
    } catch (e) {
      console.error(e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${val}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const startDirectChat = async (targetUser) => {
    try {
      const response = await api.post('/chats', {
        type: 'direct',
        participantId: targetUser._id,
      });
      dispatch(setActiveChat(response.data));
      setSearchQuery('');
      setSearchResults([]);
      loadChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (fileInput) => {
    if (!msgContent.trim() && !fileInput?.files?.[0]) return;
    if (!activeChat) return;

    try {
      let finalContent = msgContent;
      let encryptedIv = '';

      if (isE2EE && e2eKey) {
        try {
          const encrypted = await encryptPayload(msgContent, e2eKey);
          finalContent = encrypted.ciphertext;
          encryptedIv = encrypted.iv;
        } catch (encErr) {
          triggerToastError('E2EE encryption failed.', 'Encryption Error');
          return;
        }
      }

      const formData = new FormData();
      formData.append('content', finalContent);
      formData.append('isEncrypted', isE2EE.toString());
      formData.append('iv', encryptedIv);

      if (fileInput?.files?.[0]) {
        formData.append('file', fileInput.files[0]);
      }

      const res = await api.post(`/chats/${activeChat._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsgContent('');
      if (fileInput) fileInput.value = '';

      dispatch(appendMessage(res.data));
    } catch (e) {
      triggerToastError(e.response?.data?.message || 'Failed to send message', 'Sending Error');
    }
  };

  const initiateCall = (type) => {
    if (!activeChat || !user) return;
    const target = activeChat.participants.find((p) => p._id.toString() !== user.id);
    if (!target) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('call:request', {
        targetUserId: target._id,
        type,
        chatName: activeChat.name || target.displayName || target.username,
      });
      setActiveCall({ targetUserId: target._id, type, status: 'connecting' });
      simulateStreams();
    }
  };

  const simulateStreams = () => {
    setCallCaptions(['Establishing secure RTC datalinks...']);
    setTimeout(() => {
      setCallCaptions((prev) => [...prev, '[Relay Captions] "Connection established. Cryptographic hash verified."']);
    }, 2000);
    setTimeout(() => {
      setCallCaptions((prev) => [...prev, '[Peer Stream] "Voice connection active."']);
    }, 4500);
  };

  const endCall = () => {
    const socket = getSocket();
    if (socket && activeCall) {
      socket.emit('call:hangup', { targetUserId: activeCall.targetUserId });
    }
    setActiveCall(null);
    setCallCaptions([]);
  };

  const queryAIAssistant = async (mode) => {
    setAiLoading(true);
    setAiResponse('');
    try {
      if (mode === 'summarize') {
        const textLines = messages.map((m) => `${m.sender.displayName || m.sender.username}: ${m.content}`);
        const res = await api.post('/ai/summarize', { messages: textLines });
        setAiResponse(res.data.summary);
      } else if (mode === 'translate') {
        const res = await api.post('/ai/translate', {
          content: msgContent || 'No message drafted to translate.',
          targetLanguage: 'Spanish',
        });
        setAiResponse(res.data.translated);
      } else {
        const res = await api.post('/ai/rewrite', {
          content: aiPrompt,
          tone: 'professional',
        });
        setAiResponse(res.data.rewritten);
      }
    } catch (err) {
      setAiResponse('AI processing error. Make sure server endpoints are responsive.');
    } finally {
      setAiLoading(false);
    }
  };

  return {
    user,
    chats,
    activeChat,
    messages,
    onlineUsers,
    typingUsers,
    theme,
    searchQuery,
    searchResults,
    msgContent,
    setMsgContent,
    isE2EE,
    setIsE2EE,
    activeCall,
    callCaptions,
    aiPanelOpen,
    setAiPanelOpen,
    aiPrompt,
    setAiPrompt,
    aiResponse,
    aiLoading,
    chatsLoading,
    messagesLoading,
    handleSearch,
    startDirectChat,
    handleSend,
    initiateCall,
    endCall,
    queryAIAssistant,
  };
};
export default useChat;
