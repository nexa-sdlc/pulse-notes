export interface Note {
  id: string;
  title: string;
  body: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  list: () => request<Note[]>('/api/notes'),
  create: (title: string, body: string) =>
    request<Note>('/api/notes', { method: 'POST', body: JSON.stringify({ title, body }) }),
  update: (id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'done'>>) =>
    request<Note>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
};
