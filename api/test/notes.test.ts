import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

let app: FastifyInstance;
let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'pulse-'));
  app = await buildApp({ dataDir: dir, commit: 'abc123' });
});
afterEach(async () => {
  await app.close();
  await rm(dir, { recursive: true, force: true });
});

const create = async (title = 'Write tests') => {
  const res = await app.inject({ method: 'POST', url: '/api/notes', payload: { title } });
  return res.json<{ id: string; title: string; done: boolean }>();
};

describe('health', () => {
  it('reports status, version and commit', async () => {
    const res = await app.inject('/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', version: '0.1.0', commit: 'abc123' });
  });
});

describe('notes', () => {
  it('starts empty', async () => {
    expect((await app.inject('/api/notes')).json()).toEqual([]);
  });

  it('creates and lists a note', async () => {
    const note = await create();
    expect(note).toMatchObject({ title: 'Write tests', done: false });
    expect((await app.inject('/api/notes')).json()).toHaveLength(1);
  });

  it('rejects an invalid create with 400', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/notes', payload: { title: '  ' } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_request');
  });

  it('patches a note', async () => {
    const note = await create();
    const res = await app.inject({ method: 'PATCH', url: `/api/notes/${note.id}`, payload: { done: true } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: note.id, done: true });
  });

  it('rejects an empty patch with 400', async () => {
    const note = await create();
    const res = await app.inject({ method: 'PATCH', url: `/api/notes/${note.id}`, payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown ids', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    expect((await app.inject({ method: 'PATCH', url: `/api/notes/${id}`, payload: { done: true } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/api/notes/${id}` })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: '/api/notes/nope' })).json()).toEqual({ error: 'not_found' });
  });

  it('deletes a note', async () => {
    const note = await create();
    expect((await app.inject({ method: 'DELETE', url: `/api/notes/${note.id}` })).statusCode).toBe(204);
    expect((await app.inject('/api/notes')).json()).toEqual([]);
  });

  it('survives concurrent creates', async () => {
    await Promise.all(['a', 'b', 'c', 'd'].map((t) => create(t)));
    expect((await app.inject('/api/notes')).json()).toHaveLength(4);
  });

  it('answers unknown routes with JSON 404', async () => {
    const res = await app.inject('/api/nope');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'not_found' });
  });
});
