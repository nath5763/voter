import { createAsyncQueue } from '@/services/database';

describe('database operation queue', () => {
  test('runs overlapping operations in submission order', async () => {
    const queue = createAsyncQueue();
    const events: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const blocker = new Promise<void>((resolve) => { releaseFirst = resolve; });

    const first = queue(async () => {
      events.push('first:start');
      await blocker;
      events.push('first:end');
      return 1;
    });
    const second = queue(async () => {
      events.push('second');
      return 2;
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(events).toEqual(['first:start']);
    releaseFirst?.();
    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(events).toEqual(['first:start', 'first:end', 'second']);
  });

  test('continues after an operation rejects', async () => {
    const queue = createAsyncQueue();
    await expect(queue(async () => { throw new Error('expected'); })).rejects.toThrow('expected');
    await expect(queue(async () => 'recovered')).resolves.toBe('recovered');
  });
});
