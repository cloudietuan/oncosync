import { useState } from 'react';
import type { VaxSession } from '@/hooks/useSessionPersistence';

interface SessionManagerProps {
  sessions: VaxSession[];
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}

const SessionManager = ({ sessions, onSave, onLoad, onDelete }: SessionManagerProps) => {
  const [name, setName] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
  };

  return (
    <div className="vax-card-compact">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💾</span>
          <span className="text-[13px] font-semibold text-foreground">Sessions</span>
          {sessions.length > 0 && (
            <span className="vax-badge-blue">{sessions.length}</span>
          )}
        </div>
        <span className="text-muted-foreground text-xs ml-2">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              className="vax-input flex-1"
              placeholder="Session name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="vax-btn-primary text-xs px-3" disabled={!name.trim()}>
              Save
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No saved sessions yet</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sessions.map(s => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted group">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(s.savedAt).toLocaleDateString()} · {s.batches.length} batches · {s.logs.length} events
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button onClick={() => onLoad(s.name)} className="vax-btn-ghost text-xs px-2 py-1">Load</button>
                    <button onClick={() => onDelete(s.name)} className="vax-btn-ghost text-xs px-2 py-1 text-destructive hover:text-destructive">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionManager;
