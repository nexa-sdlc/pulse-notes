import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { NoteStore } from './store.js';

export interface AppOptions {
  dataDir: string;
  commit?: string;
  version?: string;
  /** Directory with the built web app; served as static files when set. */
  webDir?: string;
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().max(2000).default(''),
});
const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    body: z.string().max(2000),
    done: z.boolean(),
  })
  .partial()
  .refine((p) => Object.keys(p).length > 0, 'at least one field is required');
const idSchema = z.object({ id: z.uuid() });

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const store = new NoteStore(opts.dataDir);

  const invalid = (error: z.ZodError) => ({ error: 'invalid_request', issues: error.issues });
  const notFound = { error: 'not_found' };

  app.get('/health', async () => ({
    status: 'ok',
    version: opts.version ?? '0.1.0',
    commit: opts.commit ?? 'dev',
  }));

  app.get('/api/notes', () => store.list());

  app.post('/api/notes', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(invalid(parsed.error));
    return reply.code(201).send(await store.create(parsed.data));
  });

  app.patch('/api/notes/:id', async (req, reply) => {
    const id = idSchema.safeParse(req.params);
    const patch = patchSchema.safeParse(req.body);
    if (!id.success) return reply.code(404).send(notFound);
    if (!patch.success) return reply.code(400).send(invalid(patch.error));
    const note = await store.update(id.data.id, patch.data);
    return note ?? reply.code(404).send(notFound);
  });

  app.delete('/api/notes/:id', async (req, reply) => {
    const id = idSchema.safeParse(req.params);
    if (!id.success || !(await store.remove(id.data.id))) return reply.code(404).send(notFound);
    return reply.code(204).send();
  });

  app.setErrorHandler((err: { statusCode?: number; message: string }, _req, reply) => {
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    return reply.code(status).send({ error: status === 500 ? 'internal_error' : err.message });
  });

  if (opts.webDir) {
    await app.register(fastifyStatic, { root: opts.webDir });
  }
  app.setNotFoundHandler((_req, reply) => reply.code(404).send(notFound));

  return app;
}
