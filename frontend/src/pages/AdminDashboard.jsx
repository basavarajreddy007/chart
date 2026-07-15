import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Terminal, Users, Shield, Check, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { success: triggerToastSuccess, error: triggerToastError } = useToast();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      const usersRes = await api.get('/admin/users');
      setUsersList(usersRes.data.users);

      const reportsRes = await api.get('/admin/reports');
      setReportsList(reportsRes.data);
    } catch (e) {
      triggerToastError('Telemetry connection failed. Unauthorized action suspected.', 'Admin Sync Failure');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId, currentBlockStatus) => {
    setActionInProgress(userId);
    try {
      await api.post(`/admin/users/${userId}/block`, { block: !currentBlockStatus });
      setUsersList(
        usersList.map((u) =>
          u._id === userId ? { ...u, isBlocked: !currentBlockStatus } : u
        )
      );
      triggerToastSuccess(
        `User session has been ${!currentBlockStatus ? 'suspended' : 're-established'}.`,
        'Access Modified'
      );
    } catch (e) {
      triggerToastError('Could not execute security block.', 'Action Error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role: newRole });
      setUsersList(
        usersList.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      triggerToastSuccess(`Relay permission level upgraded to ${newRole}.`, 'Role Updated');
    } catch (e) {
      triggerToastError('Failed to alter account roles.', 'Action Error');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await api.put(`/admin/reports/${reportId}/status`, { status: action });
      setReportsList(
        reportsList.map((r) => (r._id === reportId ? { ...r, status: action } : r))
      );
      triggerToastSuccess(`Moderation ticket status logged as: ${action}.`, 'Ticket Resolved');
    } catch (e) {
      triggerToastError('Could not settle content ticket.', 'Action Error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Synchronizing secure admin telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg p-8 text-theme-text font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header toolbar */}
        <div className="flex items-center gap-4 justify-between border-b border-theme-border pb-6 text-left">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-theme-card-hover border border-theme-border rounded-md text-theme-accent transition-colors"
              aria-label="Back to messages"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Admin Console</h1>
              <p className="text-xs text-theme-muted mt-0.5">Global account moderation and database server diagnostics</p>
            </div>
          </div>
          <Button onClick={loadAdminData} size="sm">
            Refresh Server Stats
          </Button>
        </div>

        {/* Telemetry Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] uppercase font-bold text-theme-muted">Registered Users</p>
              <p className="text-2xl font-black text-theme-text">{stats.metrics.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] uppercase font-bold text-theme-muted">Sessions Online</p>
              <p className="text-2xl font-black text-theme-success">{stats.metrics.onlineUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] uppercase font-bold text-theme-muted">Total Relays Sent</p>
              <p className="text-2xl font-black text-theme-text">{stats.metrics.totalMessages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] uppercase font-bold text-theme-muted">Pending Tickets</p>
              <p className="text-2xl font-black text-theme-error">{stats.metrics.pendingReports}</p>
            </CardContent>
          </Card>
        </div>

        {/* System Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-theme-accent" /> Telemetry Load
              </CardTitle>
              <CardDescription>Server diagnostic variables updated in real time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between border-b border-theme-border pb-2">
                <span className="text-theme-muted">CPU Datalinks Load:</span>
                <span className="font-mono text-theme-success font-semibold">{stats.serverHealth.cpuUsage}%</span>
              </div>
              <div className="flex justify-between border-b border-theme-border pb-2">
                <span className="text-theme-muted">Memory Allocation:</span>
                <span className="font-mono text-theme-text">{stats.serverHealth.freeMemGB}GB Free / {stats.serverHealth.totalMemGB}GB Total</span>
              </div>
              <div className="flex justify-between border-b border-theme-border pb-2">
                <span className="text-theme-muted">Redis Cluster Status:</span>
                <span className="font-mono">
                  {stats.serverHealth.redisActive ? (
                    <Badge variant="success">Active Node</Badge>
                  ) : (
                    <Badge variant="warning">In-Memory Cache</Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-theme-border pb-2">
                <span className="text-theme-muted">LLM Provider Datalinks:</span>
                <span className="font-mono">
                  {stats.serverHealth.openaiActive ? (
                    <Badge variant="success">GPT-4 Active</Badge>
                  ) : (
                    <Badge variant="warning">Mock Engine Fallback</Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-theme-accent" /> AI Pipeline Volumes
              </CardTitle>
              <CardDescription>Distribution of LLM operations by model type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs max-h-48 overflow-y-auto">
              {stats.aiStats.length > 0 ? (
                stats.aiStats.map((item) => (
                  <div key={item._id} className="flex justify-between border-b border-theme-border pb-2">
                    <span className="font-semibold text-theme-muted">{item._id || 'General Reasoning'}:</span>
                    <span className="font-mono text-theme-accent font-semibold">{item.count} queries</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-theme-muted text-center py-4">No AI transactions logged.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card className="text-left">
          <CardHeader>
            <CardTitle>Directory Moderation</CardTitle>
            <CardDescription>Manage user roles, verify accounts, and restrict system access privileges.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-theme-muted uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">User</th>
                    <th className="px-6 py-3.5 font-semibold">Role Control</th>
                    <th className="px-6 py-3.5 font-semibold">Verification</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Moderation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u._id} className="border-b border-theme-border hover:bg-theme-card-hover/20 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-theme-text">{u.displayName || u.username}</div>
                        <div className="text-[10px] text-theme-muted font-mono">{u.email}</div>
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u._id, e.target.value)}
                          className="bg-theme-bg border border-theme-border rounded px-2.5 py-1 text-xs focus:outline-none focus:border-theme-accent text-theme-text font-medium"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <span className={u.isVerified ? 'text-theme-success font-semibold' : 'text-theme-muted'}>
                          {u.isVerified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant={u.isBlocked ? 'secondary' : 'danger'}
                          size="sm"
                          isLoading={actionInProgress === u._id}
                          onClick={() => handleToggleBlock(u._id, !!u.isBlocked)}
                        >
                          {u.isBlocked ? 'Lift Suspension' : 'Suspend Account'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Flagged Reports list */}
        <Card className="text-left">
          <CardHeader>
            <CardTitle className="text-theme-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Moderation Tickets
            </CardTitle>
            <CardDescription>Flagged message payloads requiring review by compliance staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportsList.length > 0 ? (
              reportsList.map((r) => (
                <div key={r._id} className="p-4 bg-theme-bg/60 border border-theme-border rounded-md flex items-center justify-between gap-4">
                  <div className="space-y-1.5 text-xs leading-relaxed text-left min-w-0">
                    <p className="font-semibold text-theme-text">Violation: <span className="text-theme-error">{r.reason}</span></p>
                    <p className="text-theme-muted text-[10px]">
                      Reporter: <span className="text-theme-text font-semibold">{r.reporter.username}</span> | Offender:{' '}
                      <span className="text-theme-text font-semibold">{r.reportedUser ? r.reportedUser.username : 'Message Log'}</span>
                    </p>
                    {r.reportedMessage && (
                      <p className="p-3 bg-theme-card border border-theme-border rounded-md mt-2 italic font-mono text-[10px] text-theme-text/90 max-w-xl truncate">
                        "{r.reportedMessage.content}"
                      </p>
                    )}
                    <div className="pt-1.5">
                      {r.status === 'pending' ? (
                        <Badge variant="warning">Awaiting Review</Badge>
                      ) : (
                        <Badge variant="success">Resolved</Badge>
                      )}
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(r._id, 'resolved')}
                        className="p-2 bg-theme-success/10 border border-theme-success/20 hover:border-theme-success/50 rounded-md text-theme-success transition-all"
                        title="Mark Resolved"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResolveReport(r._id, 'dismissed')}
                        className="p-2 bg-theme-error/10 border border-theme-error/20 hover:border-theme-error/50 rounded-md text-theme-error transition-all"
                        title="Dismiss Report"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-theme-muted text-center py-6 border border-dashed border-theme-border rounded-md">
                No active moderation tickets. Your channel is clear.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
