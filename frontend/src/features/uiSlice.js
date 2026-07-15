import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'glassmorphism',
  wallpaper: '',
  activeSection: 'chats',
  activeWorkspaceId: null,
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
      const html = document.documentElement;
      html.className = '';
      html.classList.add(`theme-${action.payload}`);
    },
    setWallpaper(state, action) {
      state.wallpaper = action.payload;
    },
    setActiveSection(state, action) {
      state.activeSection = action.payload;
    },
    setActiveWorkspaceId(state, action) {
      state.activeWorkspaceId = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    }
  },
});

export const { setTheme, setWallpaper, setActiveSection, setActiveWorkspaceId, toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
