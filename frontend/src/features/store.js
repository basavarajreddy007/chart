import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import uiReducer from './uiSlice';

const loadAuthState = () => {
  try {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('authUser');
    if (!token) return undefined;
    return {
      auth: {
        token,
        user: user ? JSON.parse(user) : null,
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    };
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
  preloadedState: loadAuthState(),
});

store.subscribe(() => {
  const { token, user } = store.getState().auth;
  if (token) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
  }
});

export default store;
