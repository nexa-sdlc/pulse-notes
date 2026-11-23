import { useState, type FormEvent } from 'react';
import type { Note } from './api';

interface Props {
  note: Note;
  onToggle: (note: Note) => void;
  onSave: (note: Note, title: string, body: string) => void;
  onDelete: (note: Note) => void;
}

export function NoteItem({ note, onToggle, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(note, title.trim(), body);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="note">
        <form onSubmit={submit} className="stack">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </label>
          <label>
            Details
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} />
          </label>
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`note${note.done ? ' done' : ''}`}>
      <input
        type="checkbox"
        checked={note.done}
        onChange={() => onToggle(note)}
        aria-label={`Mark "${note.title}" as ${note.done ? 'open' : 'done'}`}
      />
      <div className="grow">
        <strong className="title">{note.title}</strong>
        {note.body && <p>{note.body}</p>}
      </div>
      <div className="row">
        <button type="button" className="secondary" onClick={() => setEditing(true)} aria-label={`Edit "${note.title}"`}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(note)} aria-label={`Delete "${note.title}"`}>
          Delete
        </button>
      </div>
    </li>
  );
}
