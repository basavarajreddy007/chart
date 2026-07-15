import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useWorkspace = () => {
  const token = useSelector((state) => state.auth.token);
  const { error: triggerToastError, success: triggerToastSuccess } = useToast();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);

  const [workspaceName, setWorkspaceName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadWorkspaces();
  }, [token]);

  useEffect(() => {
    if (activeWorkspace) {
      loadTasks(activeWorkspace._id);
      loadNotes(activeWorkspace._id);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('workspace:join', activeWorkspace._id);
      }
    }
  }, [activeWorkspace]);

  const loadWorkspaces = async () => {
    setWorkspacesLoading(true);
    try {
      const res = await api.get('/workspace');
      setWorkspaces(res.data);
      if (res.data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkspacesLoading(false);
    }
  };

  const loadTasks = async (wId) => {
    setTasksLoading(true);
    try {
      const res = await api.get(`/workspace/${wId}/tasks`);
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadNotes = async (wId) => {
    try {
      const res = await api.get(`/workspace/${wId}/notes`);
      setNotes(res.data);
      if (res.data.length > 0) {
        setActiveNote(res.data[0]);
      } else {
        setActiveNote(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createNewWorkspace = async () => {
    if (!workspaceName.trim()) return;
    try {
      const res = await api.post('/workspace', { name: workspaceName });
      setWorkspaces([...workspaces, res.data]);
      setActiveWorkspace(res.data);
      setWorkspaceName('');
      triggerToastSuccess('New workspace environment configured successfully.', 'Workspace Created');
    } catch (e) {
      triggerToastError('Failed to establish workspace.', 'Error');
    }
  };

  const createNewTask = async () => {
    if (!taskTitle.trim() || !activeWorkspace) return;
    try {
      const res = await api.post(`/workspace/${activeWorkspace._id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
      });
      setTasks([...tasks, res.data]);
      setTaskTitle('');
      setTaskDesc('');
      triggerToastSuccess('Task successfully added to workspace registry.', 'Task Added');
    } catch (e) {
      triggerToastError('Failed to add task.', 'Error');
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/workspace/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const createNewNote = async () => {
    if (!noteTitle.trim() || !activeWorkspace) return;
    try {
      const res = await api.post(`/workspace/${activeWorkspace._id}/notes`, { title: noteTitle });
      setNotes([...notes, res.data]);
      setActiveNote(res.data);
      setNoteTitle('');
      triggerToastSuccess('New markdown file initialized.', 'Document Added');
    } catch (e) {
      triggerToastError('Could not initialize document.', 'Error');
    }
  };

  const editActiveNoteContent = async (newContent) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, content: newContent });

    const socket = getSocket();
    if (socket && activeWorkspace) {
      socket.emit('note:typing', {
        noteId: activeNote._id,
        workspaceId: activeWorkspace._id,
        content: newContent,
      });
    }

    try {
      await api.put(`/workspace/notes/${activeNote._id}`, { content: newContent });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    tasks,
    notes,
    activeNote,
    setActiveNote,
    workspaceName,
    setWorkspaceName,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    noteTitle,
    setNoteTitle,
    workspacesLoading,
    tasksLoading,
    createNewWorkspace,
    createNewTask,
    moveTask,
    createNewNote,
    editActiveNoteContent,
    setNotes,
  };
};
export default useWorkspace;
