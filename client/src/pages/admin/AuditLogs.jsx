import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { ShieldAlert, Search, UserCheck, Clock, FileCode } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.actorEmail?.toLowerCase().includes(term) ||
      l.description?.toLowerCase().includes(term) ||
      l.entityType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit trails tracking administrative operations, logins, billing runs, and contract mutations
          </p>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or description..."
            className="w-full text-xs border-none bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
          />
        </div>
      </Card>

      {loading ? (
        <Loader message="Loading immutable security trails..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No audit events found"
          description="Security events and administrative actions will be recorded automatically."
        />
      ) : (
        <Table headers={['Timestamp', 'Actor & Role', 'Action Event', 'Entity Scope', 'Event Description', 'IP Address']}>
          {filteredLogs.map((l) => (
            <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="font-semibold text-slate-900 block">{l.actorName || l.actorEmail}</span>
                <Badge status={l.actorRole}>{l.actorRole}</Badge>
              </td>
              <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-800">
                {l.action}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                {l.entityType} {l.entityId ? `#${l.entityId.slice(-6)}` : ''}
              </td>
              <td className="px-4 py-3 text-xs text-slate-700 max-w-md">
                {l.description}
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                {l.ipAddress || '127.0.0.1'}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};
