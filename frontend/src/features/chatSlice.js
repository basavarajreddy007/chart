import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats(state, action) {
      state.chats = action.payload;
    },
    setActiveChat(state, action) {
      state.activeChat = action.payload;
      state.messages = [];
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    appendMessage(state, action) {
      if (state.activeChat && state.activeChat._id === action.payload.chat) {
        if (!state.messages.find((m) => m._id === action.payload._id)) {
          state.messages.push(action.payload);
        }
      }
      
      const chatIdx = state.chats.findIndex((c) => c._id === action.payload.chat);
      if (chatIdx !== -1) {
        state.chats[chatIdx].lastMessage = action.payload;
        const [chat] = state.chats.splice(chatIdx, 1);
        state.chats.unshift(chat);
      }
    },
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
    },
    userStatusChange(state, action) {
      const { userId, isOnline } = action.payload;
      if (isOnline) {
        if (!state.onlineUsers.includes(userId)) state.onlineUsers.push(userId);
      } else {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    setTypingStatus(state, action) {
      const { chatId, userId, isTyping } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      } else {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter((id) => id !== userId);
      }
    },
    updatePollVotes(state, action) {
      const idx = state.messages.findIndex((m) => m._id === action.payload._id);
      if (idx !== -1) {
        state.messages[idx].pollDetails = action.payload.pollDetails;
      }
    },
    updateMessageReactions(state, action) {
      const idx = state.messages.findIndex((m) => m._id === action.payload.messageId);
      if (idx !== -1) {
        state.messages[idx].reactions = action.payload.reactions;
      }
    },
    removeMessageLocally(state, action) {
      state.messages = state.messages.filter((m) => m._id !== action.payload.messageId);
    },
  },
});

export const {
  setChats,
  setActiveChat,
  setMessages,
  appendMessage,
  setOnlineUsers,
  userStatusChange,
  setTypingStatus,
  updatePollVotes,
  updateMessageReactions,
  removeMessageLocally,
} = chatSlice.actions;
export default chatSlice.reducer;
