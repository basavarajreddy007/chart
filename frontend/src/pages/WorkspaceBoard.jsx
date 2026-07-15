import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, Plus, CheckSquare, Layers, ArrowLeft, FileText, Trash, Activity, Check, Play
} from 'lucide-react';
import { getSocket } from '../services/socket';
import { useWorkspace } from '../hooks/useWorkspace';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';

export const WorkspaceBoard = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(4);

  const {
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
    createNewWorkspace,
    createNewTask,
    moveTask,
    createNewNote,
    editActiveNoteContent,
    setNotes,
  } = useWorkspace();

  // Whiteboard Socket Synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeWorkspace) return;

    socket.on('whiteboard:draw', (drawAction) => {
      drawOnCanvasLocal(drawAction);
    });

    socket.on('whiteboard:clear', () => {
      clearCanvasLocal();
    });

    socket.on('note:typing', ({ noteId, content }) => {
      setNotes((prevNotes) =>
        prevNotes.map((n) => (n._id === noteId ? { ...n, content } : n))
      );
      if (activeNote && activeNote._id === noteId) {
        setActiveNote((prev) => (prev ? { ...prev, content } : null));
      }
    });

    return () => {
      socket.off('whiteboard:draw');
      socket.off('whiteboard:clear');
      socket.off('note:typing');
    };
  }, [activeWorkspace, activeNote, setNotes]);

  // Drawing helper functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();

    const socket = getSocket();
    if (socket && activeWorkspace) {
      socket.emit('whiteboard:draw', {
        workspaceId: activeWorkspace._id,
        drawAction: { x, y, color: brushColor, lineWidth, action: 'draw' },
      });
    }
  };

  const drawOnCanvasLocal = (drawAction) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawAction.color;
    ctx.lineWidth = drawAction.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(drawAction.x, drawAction.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    clearCanvasLocal();
    const socket = getSocket();
    if (socket && activeWorkspace) {
      socket.emit('whiteboard:clear', { workspaceId: activeWorkspace._id });
    }
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg text-theme-text font-sans">
      {/* Workspaces list Sidebar */}
      <aside className="w-72 bg-theme-card border-r border-theme-border flex flex-col p-4 space-y-6 shrink-0 z-10 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-theme-border pb-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-theme-card-hover border border-theme-border rounded-md text-theme-accent transition-colors"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider text-theme-text">Collaborative Spaces</h2>
        </div>

        <div className="space-y-3 text-left">
          <Input
            placeholder="Workspace Name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="py-1.5 px-3 text-xs"
          />
          <Button
            onClick={createNewWorkspace}
            className="w-full py-1.5 text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Workspace
          </Button>
        </div>

        <div className="space-y-1.5 flex-1 text-left">
          <p className="text-[10px] uppercase font-bold text-theme-muted px-2">Workspace List</p>
          {workspacesLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton height={32} />
              <Skeleton height={32} />
            </div>
          ) : (
            workspaces.map((w) => {
              const isActive = activeWorkspace?._id === w._id;
              return (
                <button
                  key={w._id}
                  onClick={() => setActiveWorkspace(w)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-md border text-left transition-colors ${
                    isActive
                      ? 'bg-theme-accent/10 border-theme-accent/25 text-theme-text font-semibold'
                      : 'hover:bg-theme-card-hover border-transparent text-theme-muted hover:text-theme-text'
                  }`}
                >
                  <Folder className="w-4 h-4 text-theme-accent shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate">{w.name}</p>
                    <p className="text-[9px] text-theme-muted">{w.members.length} relays active</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Workspace Workspace */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8 space-y-8 bg-theme-bg">
        {activeWorkspace ? (
          <>
            <div className="flex justify-between items-center text-left border-b border-theme-border pb-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-theme-text uppercase">{activeWorkspace.name}</h1>
                <p className="text-xs text-theme-muted">Collaborative environment logs and whiteboard synchronization</p>
              </div>
            </div>

            {/* Top Row: Kanban Board & Whiteboard */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Kanban Task list */}
              <div className="xl:col-span-7 bg-theme-card border border-theme-border p-6 rounded-lg flex flex-col space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Workspace Kanban Board
                </h3>

                <div className="grid grid-cols-3 gap-3.5 items-start">
                  {/* TO DO COLUMN */}
                  <div className="bg-theme-bg border border-theme-border p-3 rounded-md min-h-[220px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold text-theme-muted">To Do</span>
                      <Badge variant="neutral">{tasks.filter((t) => t.status === 'todo').length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter((t) => t.status === 'todo').map((t) => (
                        <div key={t._id} className="p-3 bg-theme-card border border-theme-border rounded-md text-left text-xs space-y-1.5 shadow-subtle hover:border-theme-border-hover transition-colors">
                          <p className="font-semibold text-theme-text">{t.title}</p>
                          <button
                            onClick={() => moveTask(t._id, 'in-progress')}
                            className="text-[9px] font-bold text-theme-accent hover:underline flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" /> Start Task
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IN PROGRESS COLUMN */}
                  <div className="bg-theme-bg border border-theme-border p-3 rounded-md min-h-[220px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold text-theme-muted">In Progress</span>
                      <Badge variant="primary">{tasks.filter((t) => t.status === 'in-progress').length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter((t) => t.status === 'in-progress').map((t) => (
                        <div key={t._id} className="p-3 bg-theme-card border border-theme-border rounded-md text-left text-xs space-y-1.5 shadow-subtle hover:border-theme-border-hover transition-colors">
                          <p className="font-semibold text-theme-text">{t.title}</p>
                          <button
                            onClick={() => moveTask(t._id, 'done')}
                            className="text-[9px] font-bold text-theme-success hover:underline flex items-center gap-1"
                          >
                            <Check className="w-2.5 h-2.5" /> Complete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DONE COLUMN */}
                  <div className="bg-theme-bg border border-theme-border p-3 rounded-md min-h-[220px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold text-theme-success">Completed</span>
                      <Badge variant="success">{tasks.filter((t) => t.status === 'done').length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter((t) => t.status === 'done').map((t) => (
                        <div key={t._id} className="p-3 bg-theme-card/60 border border-theme-border/50 rounded-md text-left text-xs opacity-75">
                          <p className="font-semibold text-theme-muted line-through">{t.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-theme-border pt-4 text-left">
                  <Input
                    placeholder="New task summary..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="py-1.5 px-3 text-xs"
                  />
                  <Button onClick={createNewTask} className="py-1.5 text-xs">
                    Register Task Card
                  </Button>
                </div>
              </div>

              {/* Whiteboard module */}
              <div className="xl:col-span-5 bg-theme-card border border-theme-border p-6 rounded-lg flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Canvas Whiteboard
                  </h3>
                  <button onClick={clearCanvas} className="text-xs text-theme-error hover:underline font-semibold">
                    Clear Strokes
                  </button>
                </div>

                <div className="border border-theme-border rounded-md overflow-hidden bg-theme-bg relative flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={240}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="cursor-crosshair w-full bg-theme-bg"
                  />
                </div>
                
                <div className="flex items-center gap-4 justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-theme-muted">Color</span>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <span className="text-[10px] uppercase font-bold text-theme-muted">Brush Size</span>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                      className="cursor-pointer flex-1 accent-theme-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Documentation editor */}
            <div className="bg-theme-card border border-theme-border p-6 rounded-lg flex flex-col space-y-4 text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-theme-border pb-4 gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Shared Documents
                </h3>
                <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1">
                  {notes.map((n) => {
                    const isSelected = activeNote?._id === n._id;
                    return (
                      <button
                        key={n._id}
                        onClick={() => setActiveNote(n)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-theme-accent/15 border-theme-accent text-white'
                            : 'border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-border-hover'
                        }`}
                      >
                        {n.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeNote ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <p className="text-[9px] uppercase font-bold text-theme-success tracking-widest">Collaborative markdown synchronized</p>
                  <textarea
                    value={activeNote.content || ''}
                    onChange={(e) => editActiveNoteContent(e.target.value)}
                    placeholder="Draft report summary, copy project logs, or write code..."
                    className="w-full bg-theme-bg border border-theme-border rounded-md p-4 text-xs focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent h-44 resize-none font-mono leading-relaxed text-theme-text"
                  />
                </div>
              ) : (
                <div className="text-center py-10 bg-theme-bg/30 border border-theme-border rounded-md border-dashed">
                  <p className="text-xs text-theme-muted">Create a markdown file below to begin editing.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Input
                  placeholder="New note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="flex-1 py-1.5 px-3 text-xs"
                />
                <Button onClick={createNewNote} className="py-1.5 text-xs">
                  Create Document
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
            <Layers className="w-12 h-12 text-theme-accent mb-3 animate-bounce" />
            <h2 className="text-lg font-bold text-theme-text uppercase tracking-wider">
              No Workspace Selected
            </h2>
            <p className="text-xs text-theme-muted mt-1 max-w-xs">
              Select or initialize a collaborative workspace channel in the sidebar to activate data streams.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkspaceBoard;
