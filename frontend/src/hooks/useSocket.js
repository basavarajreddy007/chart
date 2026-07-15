import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../services/socket';
import {
  appendMessage,
  userStatusChange,
  setTypingStatus,
  updatePollVotes,
  updateMessageReactions,
  removeMessageLocally,
} from '../features/chatSlice';
import { logoutSuccess } from '../features/authSlice';

export const useSocketListener = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const activeChat = useSelector((state) => state.chat.activeChat);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !token) return;

    socket.on('presence:update', (data) => {
      dispatch(userStatusChange(data));
    });

    socket.on('message:new', (message) => {
      dispatch(appendMessage(message));
      
      if (activeChat && activeChat._id === message.chat) {
        socket.emit('message:receipt', {
          messageId: message._id,
          chatId: message.chat,
          status: 'read',
        });
      }
    });

    socket.on('typing:status', (data) => {
      dispatch(setTypingStatus(data));
    });

    socket.on('poll:update', (pollMessage) => {
      dispatch(updatePollVotes(pollMessage));
    });

    socket.on('message:reaction', (data) => {
      dispatch(updateMessageReactions(data));
    });

    socket.on('message:delete', (data) => {
      dispatch(removeMessageLocally(data));
    });

    socket.on('auth:blocked', () => {
      dispatch(logoutSuccess());
      alert('Your account has been suspended by an administrator.');
    });

    return () => {
      socket.off('presence:update');
      socket.off('message:new');
      socket.off('typing:status');
      socket.off('poll:update');
      socket.off('message:reaction');
      socket.off('message:delete');
      socket.off('auth:blocked');
    };
  }, [token, activeChat, dispatch]);
};

export default useSocketListener;
