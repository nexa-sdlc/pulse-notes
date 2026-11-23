import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Note } from './api';

const note = (over: Partial<Note> = {}): Note => ({
  id: crypto.randomUUID(), title: 'Buy milk', body: '', done: false,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...over,
});

const json = (data: unknown, status = 200) =>
  Promise.resolve(new Response(status === 204 ? null : JSON.stringify(data), { status }));

let db: Note[];
beforeEach(() => {
  db = [];
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const id = url.split('/')[3];
    if (method === 'GET') return json(db);
    if (method === 'POST') {
      const n = note(JSON.parse(init!.body as string));
      db.push(n);
      return json(n, 201);
    }
    if (method === 'PATCH') {
      const n = db.find((x) => x.id === id)!;
      Object.assign(n, JSON.parse(init!.body as string));
      return json(n);
    }
    db = db.filter((x) => x.id !== id);
    return json(null, 204);
  }));
});
afterEach(() => vi.unstubAllGlobals());

it('shows the empty state', async () => {
  render(<App />);
  expect(await screen.findByText(/No notes yet/)).toBeInTheDocument();
});

it('shows an error with retry when loading fails', async () => {
  vi.mocked(fetch).mockImplementationOnce(() => json({}, 500));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (500)');
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText(/No notes yet/)).toBeInTheDocument();
});

it('creates, toggles, filters and deletes a note', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/No notes yet/);

  await user.type(screen.getByLabelText('Title'), 'Buy milk');
  await user.click(screen.getByRole('button', { name: 'Add note' }));
  expect(await screen.findByText('Buy milk')).toBeInTheDocument();

  await user.click(screen.getByRole('checkbox', { name: /Mark "Buy milk" as done/ }));
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());

  await user.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByText('No open notes.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByText('Buy milk')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }));
  await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());
});

it('edits a note', async () => {
  db = [note()];
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Edit "Buy milk"' }));
  const input = screen.getAllByLabelText('Title')[1]!;
  await user.clear(input);
  await user.type(input, 'Buy oat milk');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Buy oat milk')).toBeInTheDocument();
});
