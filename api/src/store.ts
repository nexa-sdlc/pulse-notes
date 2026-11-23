import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

export interface Note {
  id: string;
  title: string;
  body: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Pick<Note, 'title' | 'body'>;
export type NotePatch = Partial<NoteInput & Pick<Note, 'done'>>;

/** Notes persisted as one JSON file; writes are serialised and atomic. */
export class NoteStore {
  private readonly file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly dir: string) {
    this.file = join(dir, 'notes.json');
  }

  private async read(): Promise<Note[]> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as Note[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }

  private async write(notes: Note[]): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(notes, null, 2));
    await rename(tmp, this.file);
  }

  /** Run a read-modify-write step after all earlier ones have finished. */
  private mutate<T>(fn: (notes: Note[]) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const notes = await this.read();
      const result = fn(notes);
      await this.write(notes);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  list(): Promise<Note[]> {
    return this.queue.then(() => this.read());
  }

  create(input: NoteInput): Promise<Note> {
    return this.mutate((notes) => {
      const now = new Date().toISOString();
      const note: Note = { id: randomUUID(), ...input, done: false, createdAt: now, updatedAt: now };
      notes.push(note);
      return note;
    });
  }

  update(id: string, patch: NotePatch): Promise<Note | undefined> {
    return this.mutate((notes) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return undefined;
      Object.assign(note, patch, { updatedAt: new Date().toISOString() });
      return note;
    });
  }

  remove(id: string): Promise<boolean> {
    return this.mutate((notes) => {
      const i = notes.findIndex((n) => n.id === id);
      if (i < 0) return false;
      notes.splice(i, 1);
      return true;
    });
  }
}
