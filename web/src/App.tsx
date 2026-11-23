import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, type Note } from './api';
import { NoteItem } from './NoteItem';

type Filter = 'all' | 'open' | 'done';
const FILTERS: Filter[] = ['all', 'open', 'done'];

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotes(await api.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Run a mutation, then merge its result into local state; surface failures. */
  const act = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void act(async () => {
      const note = await api.create(title.trim(), body);
      setNotes((ns) => [...ns, note]);
      setTitle('');
      setBody('');
    });
  };

  const replace = (note: Note) => setNotes((ns) => ns.map((n) => (n.id === note.id ? note : n)));
  const toggle = (n: Note) => void act(async () => replace(await api.update(n.id, { done: !n.done })));
  const save = (n: Note, t: string, b: string) =>
    void act(async () => replace(await api.update(n.id, { title: t, body: b })));
  const remove = (n: Note) =>
    void act(async () => {
      await api.remove(n.id);
      setNotes((ns) => ns.filter((x) => x.id !== n.id));
    });

  const visible = notes.filter((n) => filter === 'all' || (filter === 'done') === n.done);

  return (
    <main>
      <h1>Pulse Notes</h1>

      <form onSubmit={add} className="stack card" aria-label="New note">
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What needs doing?" />
        </label>
        <label>
          Details (optional)
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={2} />
        </label>
        <button type="submit" disabled={!title.trim()}>
          Add note
        </button>
      </form>

      <div role="group" aria-label="Filter notes" className="row filters">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={f === filter ? '' : 'secondary'} aria-pressed={f === filter} onClick={() => setFilter(f)}>
            {f[0]!.toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="error">
          {error}{' '}
          <button type="button" className="secondary" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p role="status">Loading notes…</p>
      ) : visible.length === 0 ? (
        <p className="empty">{notes.length === 0 ? 'No notes yet. Add your first one above.' : `No ${filter} notes.`}</p>
      ) : (
        <ul className="notes">
          {visible.map((n) => (
            <NoteItem key={n.id} note={n} onToggle={toggle} onSave={save} onDelete={remove} />
          ))}
        </ul>
      )}
    </main>
  );
}
