import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  MessageSquare, Users, Settings as SettingsIcon, LogOut, Send, Paperclip, Sparkles,
  Phone, Video, Shield, Circle, Bot, HelpCircle, Lock, Menu, X,
  Plus, Palette, Smile, ArrowLeft, Check, CheckCheck, Search, Instagram, Edit2, Trash2
} from 'lucide-react';
import { logoutSuccess, updateUser } from '../features/authSlice';
import { setActiveChat, setChats } from '../features/chatSlice';
import { setTheme, setActiveSection } from '../features/uiSlice';
import { useSocketListener } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import api from '../services/api';
import Avatar from '../components/ui/Avatar';
import { resolveFileUrl } from '../utils/url';
import Badge from '../components/ui/Badge';
import Tooltip from '../components/ui/Tooltip';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { getSocket } from '../services/socket';
import { useToast } from '../components/ui/Toast';

const POPULAR_EMOJIS = [
  '😊', '😂', '🥺', '👍', '❤️', '🔥', '✨', '🎉',
  '😀', '😍', '🤔', '🙌', '👏', '🙏', '💡', '🚀',
  '😭', '😱', '😡', '👀', '💯', '✔️', '❌', '⚠️',
  '😎', '🥳', '😴', '🙄', '👋', '⭐', '🎈', '🎁'
];

export const ChatDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useSocketListener();

  const {
    user,
    chats: rawChats,
    activeChat,
    messages: rawMessages,
    onlineUsers: rawOnlineUsers,
    typingUsers: rawTypingUsers,
    theme,
    searchQuery = '',
    searchResults: rawSearchResults,
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
    startDirectChat: originalStartDirectChat,
    handleSend,
    initiateCall,
    endCall,
    queryAIAssistant,
  } = useChat();

  
  const chats = rawChats || [];
  const messages = rawMessages || [];
  const onlineUsers = rawOnlineUsers || [];
  const typingUsers = rawTypingUsers || {};
  const searchResults = rawSearchResults || [];

  const { success: triggerToastSuccess } = useToast();

  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  
  const [activeTab, setActiveTab] = useState('chats'); 
  const [instagramUsers, setInstagramUsers] = useState([]);
  const [selectedInstaUser, setSelectedInstaUser] = useState(null);

  
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [deniedRequests, setDeniedRequests] = useState([]);

  
  const [isLinkInstaModalOpen, setIsLinkInstaModalOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [instaHandleInput, setInstaHandleInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [instaSaveError, setInstaSaveError] = useState('');
  const [isInstaSaving, setIsInstaSaving] = useState(false);
  const [isInstaRemoving, setIsInstaRemoving] = useState(false);

  
  const chatsRef = useRef(chats);
  const selectedInstaUserRef = useRef(selectedInstaUser);
  const userRef = useRef(user);

  
  useEffect(() => {
    chatsRef.current = chats;
    selectedInstaUserRef.current = selectedInstaUser;
    userRef.current = user;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLinkInstaModalOpen && !isInstaSaving) {
          setIsLinkInstaModalOpen(false);
          setInstaHandleInput('');
          setValidationError('');
          setInstaSaveError('');
        }
        if (isRemoveConfirmOpen && !isInstaRemoving) {
          setIsRemoveConfirmOpen(false);
        }
        if (isGroupModalOpen) {
          setIsGroupModalOpen(false);
          setNewGroupName('');
          setSelectedParticipants([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLinkInstaModalOpen, isInstaSaving, isRemoveConfirmOpen, isInstaRemoving, isGroupModalOpen]);

  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRequestReceived = ({ requesterId, requesterName, requesterAvatar }) => {
      setReceivedRequests(prev => {
        if (prev.some(r => r.requesterId === requesterId)) return prev;
        return [...prev, { requesterId, requesterName, requesterAvatar }];
      });
    };

    const handleApproved = (newChat) => {
      const currentUser = userRef.current;
      const currentSelectedInstaUser = selectedInstaUserRef.current;
      const currentChats = chatsRef.current;

      const otherParticipant = newChat?.participants?.find(p => p?._id?.toString() !== currentUser?.id);
      dispatch(setChats([newChat, ...currentChats]));
      
      if (currentSelectedInstaUser && otherParticipant && otherParticipant?._id === currentSelectedInstaUser?._id) {
        dispatch(setActiveChat(newChat));
        setSelectedInstaUser(null);
        setSentRequests(prev => prev.filter(id => id !== otherParticipant?._id));
      }
      setReceivedRequests(prev => prev.filter(r => r.requesterId !== otherParticipant?._id));
    };

    const handleDenied = ({ targetUserId }) => {
      setDeniedRequests(prev => [...prev, targetUserId]);
      setSentRequests(prev => prev.filter(id => id !== targetUserId));
    };

    socket.on('permission:request_received', handleRequestReceived);
    socket.on('permission:approved', handleApproved);
    socket.on('permission:denied', handleDenied);

    return () => {
      socket.off('permission:request_received', handleRequestReceived);
      socket.off('permission:approved', handleApproved);
      socket.off('permission:denied', handleDenied);
    };
  }, []); 

  const handleSendAction = () => {
    handleSend(fileInputRef.current);
    setEmojiPickerOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    dispatch(logoutSuccess());
    navigate('/login');
  };

  const handleGroupSearch = async (val) => {
    setGroupSearchQuery(val);
    if (!val.trim()) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${val}`);
      setGroupSearchResults(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedParticipants.length === 0) return;
    try {
      const response = await api.post('/chats', {
        type: 'group',
        name: newGroupName,
        participants: selectedParticipants.map((u) => u?._id),
      });
      dispatch(setChats([response.data, ...chats]));
      dispatch(setActiveChat(response.data));
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setSelectedParticipants([]);
      setGroupSearchQuery('');
      setGroupSearchResults([]);
    } catch (e) {
      console.error('Group creation failed', e);
    }
  };

  const fetchInstagramUsers = async () => {
    try {
      const response = await api.get('/users/instagram');
      setInstagramUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching Instagram users', err);
    }
  };

  const startDirectChat = async (targetUser) => {
    if (!targetUser) return;
    const existingChat = chats.find(
      c => c?.type === 'direct' && c?.participants?.some(p => p?._id?.toString() === targetUser?._id)
    );
    
    if (existingChat) {
      dispatch(setActiveChat(existingChat));
      setSelectedInstaUser(null);
      setSearchQuery('');
      handleSearch('');
    } else {
      setSelectedInstaUser(targetUser);
      dispatch(setActiveChat(null));
      setSearchQuery('');
      handleSearch('');
    }
  };

  
  const validateInstagramHandle = (handle) => {
    if (!handle) return 'Username is required.';
    
    const cleaned = handle.replace(/\s+/g, '').trim();
    if (cleaned.includes('@')) {
      return 'Do not include the @ symbol.';
    }
    if (cleaned.length < 3) {
      return 'Username must be at least 3 characters.';
    }
    if (cleaned.length > 30) {
      return 'Username cannot exceed 30 characters.';
    }
    const regex = /^[a-zA-Z0-9._]+$/;
    if (!regex.test(cleaned)) {
      return 'Username can only contain letters, numbers, periods, and underscores.';
    }
    return null;
  };

  const handleLinkInstagram = async () => {
    const errorMsg = validateInstagramHandle(instaHandleInput);
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    setIsInstaSaving(true);
    setInstaSaveError('');
    try {
      const response = await api.put('/users/profile', {
        socialLinks: { ...user?.socialLinks, instagram: instaHandleInput.trim() }
      });
      
      dispatch(updateUser(response.data.user));
      
      triggerToastSuccess(
        user?.socialLinks?.instagram 
          ? 'Instagram account updated successfully.' 
          : 'Instagram account linked successfully.',
        'Instagram Connected'
      );
      
      setIsLinkInstaModalOpen(false);
      setInstaHandleInput('');
      setValidationError('');
      fetchInstagramUsers();
    } catch (err) {
      setInstaSaveError(err.response?.data?.message || 'Failed to link handle. Please try again.');
    } finally {
      setIsInstaSaving(false);
    }
  };

  const handleRemoveInstagram = async () => {
    setIsInstaRemoving(true);
    try {
      const response = await api.put('/users/profile', {
        socialLinks: { ...user?.socialLinks, instagram: '' }
      });
      
      dispatch(updateUser(response.data.user));
      triggerToastSuccess('Instagram account link removed successfully.', 'Instagram Removed');
      setIsRemoveConfirmOpen(false);
      fetchInstagramUsers();
    } catch (err) {
      console.error('Failed to remove Instagram handle', err);
    } finally {
      setIsInstaRemoving(false);
    }
  };

  
  const handleInstaInputChange = (e) => {
    const input = e.target;
    const val = input.value;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    
    
    const cleaned = val.replace(/\s+/g, '').replace(/@/g, '');
    
    
    let shift = 0;
    for (let i = 0; i < selectionStart; i++) {
      if (val[i] === ' ' || val[i] === '@') {
        shift++;
      }
    }
    
    setInstaHandleInput(cleaned);
    setValidationError('');
    
    
    requestAnimationFrame(() => {
      input.selectionStart = selectionStart - shift;
      input.selectionEnd = selectionEnd - shift;
    });
  };

  
  const PremiumWelcomeScreen = () => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-theme-bg/10 relative overflow-hidden select-none whatsapp-bg">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-theme-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-pink-500/5 blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col items-center max-w-md space-y-6 z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border border-theme-accent/20 animate-ping duration-[3s]" />
            <div className="absolute inset-2 rounded-full border border-theme-accent/30 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-theme-accent/15 flex items-center justify-center text-theme-accent shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-theme-accent/25">
              <MessageSquare className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-xl font-extrabold tracking-tight text-theme-text bg-gradient-to-r from-theme-text via-theme-text to-theme-accent bg-clip-text">
              Nebula Cryptographic Link
            </h2>
            <p className="text-xs text-theme-muted leading-relaxed max-w-sm mx-auto">
              Connect to secure channels, synchronize message relays, and query AI assistant subagents within an end-to-end encrypted node.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-4">
            <div className="p-3 bg-theme-card border border-theme-border rounded-xl text-left space-y-1 shadow-sm hover:border-theme-border-hover transition-colors">
              <Lock className="w-4 h-4 text-theme-success" />
              <h4 className="text-[10px] font-bold uppercase text-theme-text">End-to-End Cryptography</h4>
              <p className="text-[9px] text-theme-muted leading-relaxed">Encrypted message frames.</p>
            </div>
            <div className="p-3 bg-theme-card border border-theme-border rounded-xl text-left space-y-1 shadow-sm hover:border-theme-border-hover transition-colors">
              <Bot className="w-4 h-4 text-theme-accent" />
              <h4 className="text-[10px] font-bold uppercase text-theme-text">Nebula Copilot</h4>
              <p className="text-[9px] text-theme-muted leading-relaxed">AI prompt summary & translation.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9.5px] text-theme-muted/80 bg-theme-card/60 px-3 py-1.5 rounded-full border border-theme-border/50">
            <Shield className="w-3.5 h-3.5 text-theme-accent" /> Node Status: <span className="text-theme-success font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-theme-success inline-block animate-pulse" /> Secure & Synced</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg text-theme-text font-sans antialiased">
      {}
      <aside
        className={`w-full md:w-[400px] border-r border-theme-border flex flex-col shrink-0 z-20 bg-theme-card transition-all ${
          activeChat || selectedInstaUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {}
        <header className="h-16 bg-theme-topbar border-b border-theme-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={user?.displayName || user?.username || '?'} size="sm" isOnline={true} />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-theme-text truncate max-w-[120px]">{user?.displayName || user?.username}</p>
              <p className="text-[9px] text-theme-muted uppercase tracking-wider font-mono">{user?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="New Group">
              <button
                onClick={() => setIsGroupModalOpen(true)}
                aria-label="New Group"
                className="p-2 rounded-full hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Change Styling Preset">
              <button
                onClick={() => {
                  const themes = ['glassmorphism', 'amoled', 'material', 'cyberpunk', 'neon'];
                  const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
                  dispatch(setTheme(themes[nextIdx]));
                }}
                aria-label="Change theme"
                className="p-2 rounded-full hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-colors"
              >
                <Palette className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Account Settings">
              <button
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className="p-2 rounded-full hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Log Out">
              <button
                onClick={handleLogout}
                aria-label="Log Out"
                className="p-2 rounded-full hover:bg-theme-error/15 text-theme-error transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </header>

        {}
        <div className="p-2 border-b border-theme-border bg-theme-card shrink-0">
          <div 
            style={{ backgroundColor: 'var(--theme-bg)' }}
            className="flex items-center border border-theme-border rounded-lg px-3 py-1.5 gap-2.5 focus-within:border-theme-accent focus-within:ring-1 focus-within:ring-theme-accent transition-all"
          >
            <Search className="w-4 h-4 text-theme-muted shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-xs text-theme-text placeholder:text-theme-muted/50"
            />
          </div>
        </div>

        {}
        <div className="flex border-b border-theme-border text-xs bg-theme-card shrink-0">
          <button
            onClick={() => {
              setActiveTab('chats');
              setSelectedInstaUser(null);
            }}
            className={`flex-1 py-2.5 text-center font-semibold transition-all border-b-2 ${
              activeTab === 'chats'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-muted hover:text-theme-text'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => {
              setActiveTab('instagram');
              fetchInstagramUsers();
            }}
            className={`flex-1 py-2.5 text-center font-semibold transition-all border-b-2 ${
              activeTab === 'instagram'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-muted hover:text-theme-text'
            }`}
          >
            Instagram Links
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto bg-theme-card p-1 space-y-0.5 scrollbar-thin">
          {activeTab === 'instagram' ? (
            <div className="p-1 space-y-0.5 animate-in fade-in duration-200">
              {}
              <div className="p-4 m-2 bg-theme-bg/60 border border-theme-border/60 rounded-xl text-left shadow-sm hover:border-theme-border hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {user?.socialLinks?.instagram ? (
                      <div className="space-y-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-theme-text">Instagram Connected</h4>
                          <p className="text-[11px] font-semibold text-theme-accent mt-0.5 truncate">@{user.socialLinks.instagram}</p>
                          <p className="text-[9px] text-theme-muted leading-relaxed mt-0.5">Your account is linked successfully.</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setInstaHandleInput(user.socialLinks.instagram);
                              setIsLinkInstaModalOpen(true);
                              setValidationError('');
                              setInstaSaveError('');
                            }}
                            className="flex-1 py-1 px-2.5 bg-theme-accent hover:bg-theme-accent-hover text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                          >
                            Change Account
                          </button>
                          <button
                            onClick={() => setIsRemoveConfirmOpen(true)}
                            className="p-1.5 bg-theme-error/10 hover:bg-theme-error/20 text-theme-error border border-theme-error/15 rounded-lg transition-colors"
                            aria-label="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-bold text-theme-text">Instagram Account</h4>
                          <p className="text-[9px] text-theme-muted leading-relaxed mt-0.5">
                            Connect your Instagram account to make it easier for friends to discover and chat with you.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setInstaHandleInput('');
                            setIsLinkInstaModalOpen(true);
                            setValidationError('');
                            setInstaSaveError('');
                          }}
                          className="w-full py-1.5 px-3 bg-theme-accent hover:bg-theme-accent-hover text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Link Instagram Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[10px] uppercase font-bold text-theme-muted px-3 py-2 border-t border-theme-border/50 mt-2 pt-2">Connected Instagram Accounts</p>
              {instagramUsers.length > 0 ? (
                instagramUsers.map((u) => {
                  const existingChat = chats.find(
                    c => c?.type === 'direct' && c?.participants?.some(p => p?._id?.toString() === u?._id)
                  );
                  return (
                    <button
                      key={u?._id}
                      onClick={() => {
                        if (existingChat) {
                          dispatch(setActiveChat(existingChat));
                          setSelectedInstaUser(null);
                          setActiveTab('chats');
                        } else {
                          setSelectedInstaUser(u);
                          dispatch(setActiveChat(null));
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200 hover:bg-theme-card-hover ${
                        selectedInstaUser?._id === u?._id ? 'bg-theme-accent/5 border border-theme-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={u?.displayName || u?.username} size="sm" isOnline={onlineUsers.includes(u?._id)} />
                        <div className="text-left truncate flex-1">
                          <p className="text-xs font-semibold truncate text-theme-text">{u?.displayName || u?.username}</p>
                          <p className="text-[10px] text-theme-accent truncate flex items-center gap-1 font-medium mt-0.5">
                            <Instagram className="w-3.5 h-3.5 text-pink-500" /> {u?.socialLinks?.instagram || '@username'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-theme-muted p-3">No connected Instagram accounts found.</p>
              )}
            </div>
          ) : chatsLoading ? (
            <div className="space-y-3 p-3">
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
            </div>
          ) : searchQuery ? (
            <div className="animate-in fade-in duration-200">
              <p className="text-[10px] uppercase font-bold text-theme-muted px-3 py-2">Search Results</p>
              {searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <button
                    key={u?._id}
                    onClick={() => startDirectChat(u)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-theme-card-hover rounded-md text-left transition-colors"
                  >
                    <Avatar name={u?.displayName || u?.username} size="sm" isOnline={u?.isOnline} />
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-theme-text">{u?.displayName || u?.username}</p>
                        {u?.socialLinks?.instagram && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-pink-500/15 text-pink-400 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            <Instagram className="w-2.5 h-2.5 text-pink-500" /> @{u.socialLinks.instagram}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-theme-muted">{u?.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-theme-muted p-3">No users matched search criteria.</p>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              {chats.map((c) => {
                const otherParticipant = c?.participants?.find((p) => p?._id?.toString() !== user?.id);
                const displayName = c?.type === 'group' ? c?.name : (otherParticipant?.displayName || otherParticipant?.username || 'Channel Relay');
                const isOnline = c?.type === 'direct' && otherParticipant ? onlineUsers.includes(otherParticipant?._id) : false;
                const isActive = activeChat?._id === c?._id;
                
                const isTyping = (typingUsers[c?._id] || []).length > 0;
                
                const formattedTime = c?.lastMessage
                  ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <button
                    key={c?._id}
                    onClick={() => {
                      dispatch(setActiveChat(c));
                      setSelectedInstaUser(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200 ${
                      isActive
                        ? 'bg-theme-accent/10 text-theme-text font-semibold shadow-sm'
                        : 'hover:bg-theme-card-hover text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={displayName} size="sm" isOnline={isOnline} />
                      <div className="text-left truncate flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-theme-text">{displayName}</p>
                            {c?.type === 'direct' && otherParticipant?.socialLinks?.instagram && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-pink-500/15 text-pink-400 px-1.5 py-0.2 rounded-full shrink-0 select-none">
                                <Instagram className="w-2.5 h-2.5 text-pink-500" /> @{otherParticipant.socialLinks.instagram}
                              </span>
                            )}
                          </div>
                          {formattedTime && <span className="text-[9px] text-theme-muted shrink-0">{formattedTime}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          {isTyping ? (
                            <p className="text-[10px] text-theme-accent font-medium animate-pulse">typing...</p>
                          ) : (
                            <p className="text-[10px] text-theme-muted truncate max-w-[200px]">
                              {c?.lastMessage?.content || 'Secure transmission link idle'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {}
      <main
        className={`flex-1 flex flex-col relative bg-theme-bg h-full transition-all ${
          activeChat || selectedInstaUser ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedInstaUser ? (
          <div className="flex-1 flex flex-col items-center justify-between text-center p-8 bg-theme-bg/10 relative overflow-hidden select-none whatsapp-bg">
            {}
            <div className="w-full flex justify-start md:hidden">
              <button
                onClick={() => setSelectedInstaUser(null)}
                className="p-1.5 hover:bg-theme-card-hover rounded-full text-theme-muted hover:text-theme-text transition-colors"
                aria-label="Back to contact list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            {!activeChat && <div className="hidden md:block" />}
            
            <div className="flex flex-col items-center max-w-sm space-y-6 z-10 animate-in fade-in duration-300">
              <Avatar name={selectedInstaUser?.displayName || selectedInstaUser?.username} size="xl" />
              
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-theme-text">
                  {selectedInstaUser?.displayName || selectedInstaUser?.username}
                </h3>
                <p className="text-xs text-theme-accent font-medium flex items-center justify-center gap-1">
                  <Instagram className="w-4 h-4" /> {selectedInstaUser?.socialLinks?.instagram || '@username'}
                </p>
              </div>

              {deniedRequests.includes(selectedInstaUser?._id) ? (
                <div className="space-y-4 w-full">
                  <div className="p-3.5 bg-theme-error/10 border border-theme-error/20 rounded-lg text-xs text-theme-error font-medium">
                    Connection request was declined by the user.
                  </div>
                  <button
                    onClick={() => {
                      const socket = getSocket();
                      if (socket) {
                        socket.emit('permission:request', { targetUserId: selectedInstaUser?._id });
                        setSentRequests(prev => [...prev, selectedInstaUser?._id]);
                        setDeniedRequests(prev => prev.filter(id => id !== selectedInstaUser?._id));
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Try Requesting Again
                  </button>
                </div>
              ) : sentRequests.includes(selectedInstaUser?._id) ? (
                <div className="space-y-4 w-full">
                  <div className="flex flex-col items-center gap-2.5 p-4 bg-theme-card border border-theme-border rounded-lg">
                    <div className="w-5 h-5 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-theme-muted">
                      Waiting for approval...
                    </p>
                  </div>
                  <p className="text-[10px] text-theme-muted max-w-xs leading-relaxed mx-auto">
                    You can start communicating once they accept your chat request.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  <p className="text-xs text-theme-muted leading-relaxed">
                    To safeguard privacy, you must request permission before starting a direct conversation with this user.
                  </p>
                  <button
                    onClick={() => {
                      const socket = getSocket();
                      if (socket) {
                        socket.emit('permission:request', { targetUserId: selectedInstaUser?._id });
                        setSentRequests(prev => [...prev, selectedInstaUser?._id]);
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Request Chat Permission
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-normal z-10 pb-4">
              <Lock className="w-3 h-3" /> End-to-end encrypted
            </div>
          </div>
        ) : activeChat ? (
          <>
            {}
            <header className="h-16 bg-theme-topbar border-b border-theme-border px-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                {}
                <button
                  onClick={() => dispatch(setActiveChat(null))}
                  className="p-1.5 hover:bg-theme-card-hover rounded-full text-theme-muted hover:text-theme-text md:hidden shrink-0 transition-colors"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {}
                {activeChat?.type === 'group' ? (
                  <Avatar name={activeChat?.name} size="sm" />
                ) : (
                  <Avatar
                    name={activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?.displayName || ''}
                    src={activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?.avatar}
                    size="sm"
                    isOnline={onlineUsers.includes(activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?._id)}
                  />
                )}
                
                <div className="text-left min-w-0">
                  <h3 className="text-xs font-semibold text-theme-text truncate max-w-[150px] sm:max-w-[300px]">
                    {activeChat?.type === 'group'
                      ? activeChat?.name
                      : activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?.displayName}
                  </h3>
                  
                  {}
                  {(typingUsers[activeChat?._id] || []).length > 0 ? (
                    <p className="text-[10px] text-theme-accent font-medium animate-pulse">typing...</p>
                  ) : activeChat?.type === 'direct' ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-theme-muted uppercase tracking-wider font-mono shrink-0">
                        {onlineUsers.includes(activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?._id) ? 'Online' : 'Offline'}
                      </span>
                      {activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?.socialLinks?.instagram && (
                        <>
                          <span className="text-theme-border text-[9px] shrink-0">|</span>
                          <span className="text-[9.5px] text-theme-accent flex items-center gap-0.5 font-medium hover:underline cursor-pointer select-text truncate max-w-[120px]">
                            <Instagram className="w-3 h-3 text-pink-500" /> @{activeChat?.participants?.find((p) => p?._id?.toString() !== user?.id)?.socialLinks?.instagram}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-[9px] text-theme-muted truncate">
                      {activeChat?.participants?.length} participants
                    </p>
                  )}
                </div>
              </div>

              {}
              <div className="flex items-center gap-1.5 shrink-0">
                {isE2EE ? (
                  <Badge variant="success" className="text-[8px] py-0.5 font-bold tracking-wider">E2EE</Badge>
                ) : (
                  <Badge variant="neutral" className="text-[8px] py-0.5 font-bold tracking-wider">TLS</Badge>
                )}

                <Tooltip content="Toggle E2E Cryptographic Encrypt">
                  <button
                    onClick={() => setIsE2EE(!isE2EE)}
                    aria-label="Toggle encryption"
                    className={`p-2 rounded-full transition-colors ${
                      isE2EE
                        ? 'bg-theme-success/10 text-theme-success'
                        : 'hover:bg-theme-card-hover text-theme-muted'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Initiate voice relay call">
                  <button
                    onClick={() => initiateCall('voice')}
                    aria-label="Voice Call"
                    className="p-2 rounded-full hover:bg-theme-card-hover text-theme-accent transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Initiate video connection feed">
                  <button
                    onClick={() => initiateCall('video')}
                    aria-label="Video Call"
                    className="p-2 rounded-full hover:bg-theme-card-hover text-theme-accent transition-colors"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </Tooltip>

                <div className="border-l border-theme-border h-4 mx-1"></div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  className="flex items-center gap-1.5 font-semibold py-1 px-2.5 h-8 border-theme-border text-theme-accent hover:border-theme-accent shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nebula AI</span>
                </Button>
              </div>
            </header>

            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative whatsapp-bg scrollbar-thin">
              {messagesLoading ? (
                <div className="space-y-4">
                  <div className="flex justify-start"><Skeleton width={200} height={40} /></div>
                  <div className="flex justify-end"><Skeleton width={180} height={40} /></div>
                  <div className="flex justify-start"><Skeleton width={250} height={40} /></div>
                </div>
              ) : messages.length > 0 ? (
                messages.map((m) => {
                  const isSelf = m?.sender?._id?.toString() === user?.id;
                  
                  
                  let checkmarks = null;
                  if (isSelf) {
                    const isRead = m?.readBy?.some(id => id?.toString() !== user?.id);
                    const isDelivered = m?.deliveredTo?.some(id => id?.toString() !== user?.id);
                    
                    if (isRead) {
                      checkmarks = (
                        <span className="text-[#53bdeb] ml-1 flex items-center shrink-0">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </span>
                      );
                    } else if (isDelivered) {
                      checkmarks = (
                        <span className="text-theme-muted ml-1 flex items-center shrink-0">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </span>
                      );
                    } else {
                      checkmarks = (
                        <span className="text-theme-muted ml-1 flex items-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      );
                    }
                  }

                  return (
                    <div key={m?._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div
                        style={{
                          backgroundColor: isSelf ? 'var(--theme-bubble-sent)' : 'var(--theme-bubble-received)',
                          color: isSelf ? 'var(--theme-bubble-sent-text)' : 'var(--theme-bubble-received-text)',
                        }}
                        className={`max-w-[65%] p-2 px-3 rounded-xl border border-theme-border/5 text-left shadow-sm relative flex flex-col animate-in fade-in duration-200 ${
                          isSelf
                            ? 'rounded-tr-none border-theme-accent/10 shadow-[0_1px_2px_rgba(59,130,246,0.1)]'
                            : 'rounded-tl-none border-theme-border/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                        }`}
                      >
                        {!isSelf && activeChat?.type === 'group' && (
                          <div className="flex items-center gap-1.5 mb-1 select-none">
                            <span className="text-[10px] font-bold text-theme-accent">
                              {m?.sender?.displayName || m?.sender?.username}
                            </span>
                            {m?.sender?.socialLinks?.instagram && (
                              <span className="text-[8.5px] text-pink-400 flex items-center gap-0.5 font-medium">
                                <Instagram className="w-2.5 h-2.5 text-pink-500 shrink-0" /> @{m.sender.socialLinks.instagram}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs select-text whitespace-pre-wrap leading-relaxed break-words pb-3 pr-8">
                          {m?.content}
                        </p>

                        {}
                        {m?.fileDetails?.url && (
                          <div className="mt-1 mb-1.5 p-2 bg-theme-bg/60 border border-theme-border rounded-lg flex items-center gap-2 max-w-full">
                            <Paperclip className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                            <div className="text-left min-w-0">
                              <a
                                href={resolveFileUrl(m.fileDetails.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold hover:underline block truncate max-w-[150px] text-theme-accent"
                              >
                                {m.fileDetails.fileName}
                              </a>
                              <p className="text-[9px] text-theme-muted">
                                {(m.fileDetails.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        )}

                        {}
                        <div className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[9px] text-theme-muted select-none">
                          <span>
                            {new Date(m?.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {m?.isEncrypted && <Lock className="w-2 h-2 text-theme-success ml-0.5" />}
                          {checkmarks}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 z-10">
                  <MessageSquare className="w-8 h-8 text-theme-muted mb-2 animate-bounce" />
                  <p className="text-xs text-theme-muted font-medium">This channel is secure and idle. Send a message to begin.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {}
            {activeCall && (
              <div className="absolute inset-0 bg-theme-bg/95 flex flex-col items-center justify-center p-8 z-30 animate-in fade-in duration-200">
                <div className="bg-theme-card border border-theme-border w-full max-w-xl p-8 rounded-lg flex flex-col items-center justify-between h-[60%] shadow-popover">
                  <div className="text-center space-y-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-theme-accent">WebRTC Audio/Video Connection</h2>
                    <p className="text-[10px] text-theme-muted uppercase tracking-wider">Session Link status: {activeCall.status}</p>
                  </div>

                  <div className="w-full flex gap-4 justify-center items-center my-6 flex-1 max-w-md">
                    <div className="w-1/2 aspect-video bg-theme-bg border border-theme-border rounded-md relative flex items-center justify-center">
                      <span className="text-[9px] text-theme-muted absolute top-2 left-2 uppercase tracking-wider">Local Camera</span>
                      <Video className="w-5 h-5 text-theme-muted animate-pulse" />
                    </div>
                    <div className="w-1/2 aspect-video bg-theme-bg border border-theme-border rounded-md relative flex items-center justify-center">
                      <span className="text-[9px] text-theme-muted absolute top-2 left-2 uppercase tracking-wider">Remote User</span>
                      <Video className="w-5 h-5 text-theme-accent animate-pulse" />
                    </div>
                  </div>

                  {callCaptions.length > 0 && (
                    <div className="w-full max-w-md p-3 bg-theme-bg border border-theme-border rounded-md text-xs max-h-24 overflow-y-auto mb-6 text-left font-mono space-y-1">
                      {callCaptions.map((cap, i) => (
                        <p key={i} className="text-theme-success">{cap}</p>
                      ))}
                    </div>
                  )}

                  <Button variant="danger" onClick={endCall}>
                    Disconnect Session Relays
                  </Button>
                </div>
              </div>
            )}

            {}
            <div className="p-3 bg-theme-topbar border-t border-theme-border shrink-0 relative">
              {}
              {emojiPickerOpen && (
                <div className="absolute bottom-16 left-4 bg-theme-card border border-theme-border p-3 rounded-lg shadow-popover z-50 w-72 h-48 overflow-y-auto grid grid-cols-8 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 scrollbar-thin">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setMsgContent(prev => prev + emoji);
                      }}
                      className="text-lg hover:bg-theme-card-hover p-1 rounded transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    aria-label="Open emojis panel"
                    className={`p-2 rounded-full hover:bg-theme-card-hover transition-colors ${emojiPickerOpen ? 'text-theme-accent' : 'text-theme-muted hover:text-theme-text'}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload attachment file"
                    className="p-2 rounded-full hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleSendAction}
                />

                <input
                  type="text"
                  placeholder={isE2EE ? "Type encrypted message..." : "Type a message"}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAction()}
                  style={{ backgroundColor: 'var(--theme-input-bg)' }}
                  className="flex-1 border border-theme-border focus:border-theme-border-hover focus:outline-none rounded-lg px-4 py-2 text-xs text-theme-text placeholder:text-theme-muted/50 transition-all"
                />

                <button
                  onClick={handleSendAction}
                  aria-label="Send message"
                  className="p-2.5 bg-theme-accent hover:bg-theme-accent-hover text-white rounded-full transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <PremiumWelcomeScreen />
        )}
      </main>

      {}
      {aiPanelOpen && activeChat && (
        <aside
          aria-label="AI Assistant Sidebar"
          className="w-80 bg-theme-card border-l border-theme-border flex flex-col shrink-0 z-15 p-6 space-y-6 animate-in slide-in-from-right-4 duration-300"
        >
          <div className="flex justify-between items-center border-b border-theme-border pb-3">
            <h3 className="font-bold text-xs tracking-widest text-theme-accent uppercase flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Nebula Assistant
            </h3>
            <button
              onClick={() => setAiPanelOpen(false)}
              className="p-1 hover:bg-theme-card-hover rounded-md text-theme-muted hover:text-theme-text transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => queryAIAssistant('summarize')}
              className="w-full text-xs text-left p-2.5 bg-theme-bg border border-theme-border rounded-md flex justify-between items-center hover:border-theme-accent transition-colors font-medium"
            >
              <span>Summarize conversation logs</span>
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            </button>
            <button
              onClick={() => queryAIAssistant('translate')}
              className="w-full text-xs text-left p-2.5 bg-theme-bg border border-theme-border rounded-md flex justify-between items-center hover:border-theme-accent transition-colors font-medium"
            >
              <span>Translate drafted message</span>
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-theme-muted">Prompt Directive</label>
              <textarea
                placeholder="Ask AI to draft replies, rewrite sentences, audit code blocks..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-md p-3 text-xs focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent h-24 resize-none text-theme-text placeholder:text-theme-muted/50"
              />
            </div>
            
            <Button
              onClick={() => queryAIAssistant('general')}
              disabled={aiLoading}
              className="w-full py-2 text-xs"
            >
              {aiLoading ? 'Synthesizing...' : 'Submit Prompt'}
            </Button>

            <div className="flex-1 flex flex-col gap-1.5 min-h-0 border-t border-theme-border pt-4">
              <span className="text-[10px] uppercase font-bold text-theme-muted">AI Output Response</span>
              <div className="flex-1 bg-theme-bg border border-theme-border rounded-md p-3 text-xs overflow-y-auto leading-relaxed select-text font-mono text-theme-text/90 scrollbar-thin">
                {aiLoading ? (
                  <span className="animate-pulse text-theme-accent">Reasoning engine processing variables...</span>
                ) : (
                  aiResponse || 'No response generated.'
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border border-theme-border rounded-xl w-full max-w-md overflow-hidden shadow-popover animate-in zoom-in-95 duration-200">
            {}
            <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-topbar">
              <h3 className="font-bold text-sm text-theme-text flex items-center gap-2">
                <Users className="w-5 h-5 text-theme-accent" /> Create New Group
              </h3>
              <button
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setNewGroupName('');
                  setSelectedParticipants([]);
                  setGroupSearchQuery('');
                  setGroupSearchResults([]);
                }}
                className="p-1 hover:bg-theme-card-hover rounded-md text-theme-muted hover:text-theme-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {}
            <div className="p-4 space-y-4 text-left">
              {}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted">Group Subject</label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text"
                />
              </div>

              {}
              {selectedParticipants.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-theme-muted">Selected Members ({selectedParticipants.length})</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-theme-border/50 rounded-lg bg-theme-bg/30 scrollbar-thin">
                    {selectedParticipants.map(u => (
                      <div key={u?._id} className="flex items-center gap-1 bg-theme-accent/15 border border-theme-accent/20 px-2 py-0.5 rounded-full text-[10px] text-theme-text">
                        <span>{u?.displayName || u?.username}</span>
                        <button
                          onClick={() => setSelectedParticipants(prev => prev.filter(p => p?._id !== u?._id))}
                          className="hover:text-theme-error ml-0.5 font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted">Search Participants</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={groupSearchQuery}
                  onChange={(e) => handleGroupSearch(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text"
                />
              </div>

              {}
              {groupSearchQuery && (
                <div className="border border-theme-border rounded-lg max-h-36 overflow-y-auto bg-theme-bg/30 p-1 divide-y divide-theme-border/50 scrollbar-thin">
                  {groupSearchResults.length > 0 ? (
                    groupSearchResults.map(u => {
                      const isSelected = selectedParticipants.some(p => p?._id === u?._id);
                      return (
                        <button
                          key={u?._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedParticipants(prev => prev.filter(p => p?._id !== u?._id));
                            } else {
                              setSelectedParticipants(prev => [...prev, u]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 hover:bg-theme-card-hover text-left transition-colors text-xs ${
                            isSelected ? 'bg-theme-accent/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Avatar name={u?.displayName || u?.username} size="xs" />
                            <div className="truncate">
                              <p className="font-semibold text-theme-text">{u?.displayName || u?.username}</p>
                              <p className="text-[9px] text-theme-muted">{u?.email}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-theme-accent border-theme-accent text-white' : 'border-theme-border'
                          }`}>
                            {isSelected && '✓'}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-theme-muted p-3 text-center">No users matched.</p>
                  )}
                </div>
              )}
            </div>

            {}
            <div className="p-3 border-t border-theme-border bg-theme-topbar flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setNewGroupName('');
                  setSelectedParticipants([]);
                  setGroupSearchQuery('');
                  setGroupSearchResults([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedParticipants.length === 0}
              >
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {receivedRequests.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border border-theme-border rounded-xl w-full max-w-sm overflow-hidden shadow-popover animate-in zoom-in-95 duration-200 text-center p-6 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent">
                <MessageSquare className="w-8 h-8" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-theme-text">Chat Permission Request</h3>
              <p className="text-xs text-theme-muted">
                <span className="font-semibold text-theme-text">{receivedRequests[0].requesterName}</span> wants to start a conversation with you.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const req = receivedRequests[0];
                  const socket = getSocket();
                  if (socket) {
                    socket.emit('permission:decline', { requesterId: req.requesterId });
                  }
                  setReceivedRequests(prev => prev.slice(1));
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-theme-bg border border-theme-border hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-all"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  const req = receivedRequests[0];
                  const socket = getSocket();
                  if (socket) {
                    socket.emit('permission:accept', { requesterId: req.requesterId });
                  }
                  setReceivedRequests(prev => prev.slice(1));
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-theme-accent hover:bg-theme-accent-hover text-white transition-all"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {isLinkInstaModalOpen && (
        <div 
          onClick={() => !isInstaSaving && setIsLinkInstaModalOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-card border border-theme-border rounded-xl w-full max-w-sm overflow-hidden shadow-popover animate-in zoom-in-95 duration-200"
          >
            {}
            <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-topbar">
              <h3 className="font-bold text-sm text-theme-text flex items-center gap-2">
                <Instagram className="w-5 h-5 text-theme-accent" /> Link Instagram Account
              </h3>
              <button
                disabled={isInstaSaving}
                onClick={() => {
                  setIsLinkInstaModalOpen(false);
                  setInstaHandleInput('');
                  setValidationError('');
                  setInstaSaveError('');
                }}
                className="p-1 hover:bg-theme-card-hover rounded-md text-theme-muted hover:text-theme-text transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {}
            <div className="p-4 space-y-3.5 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted">Instagram Username</label>
                <input
                  type="text"
                  placeholder="your_username"
                  value={instaHandleInput}
                  disabled={isInstaSaving}
                  onChange={handleInstaInputChange}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text disabled:opacity-50"
                />
                
                {}
                {validationError && (
                  <p className="text-[10px] font-semibold text-theme-error animate-in fade-in duration-100">
                    {validationError}
                  </p>
                )}

                {}
                {instaSaveError && (
                  <p className="text-[10px] font-semibold text-theme-error animate-in fade-in duration-100">
                    {instaSaveError}
                  </p>
                )}

                <p className="text-[9.5px] text-theme-muted leading-relaxed">
                  Do not include @. Example: <span className="font-medium text-theme-text">john_doe</span>
                </p>
              </div>
            </div>

            {}
            <div className="p-3 border-t border-theme-border bg-theme-topbar flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isInstaSaving}
                onClick={() => {
                  setIsLinkInstaModalOpen(false);
                  setInstaHandleInput('');
                  setValidationError('');
                  setInstaSaveError('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isInstaSaving}
                disabled={isInstaSaving || !instaHandleInput.trim()}
                onClick={handleLinkInstagram}
              >
                Save Handle
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {isRemoveConfirmOpen && (
        <div 
          onClick={() => !isInstaRemoving && setIsRemoveConfirmOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-card border border-theme-border rounded-xl w-full max-w-sm overflow-hidden shadow-popover animate-in zoom-in-95 duration-200 text-center p-6 space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-theme-error/10 flex items-center justify-center text-theme-error">
                <Trash2 className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-theme-text">Remove Instagram Link?</h3>
              <p className="text-xs text-theme-muted leading-relaxed font-normal">
                Other users will no longer see your Instagram account handle, and new users won't be able to request direct chat permissions.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isInstaRemoving}
                onClick={() => setIsRemoveConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-theme-bg border border-theme-border hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isInstaRemoving}
                onClick={handleRemoveInstagram}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-theme-error hover:bg-theme-error-hover text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isInstaRemoving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDashboard;
