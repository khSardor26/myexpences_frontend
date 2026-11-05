import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from '@/lib/api';
import { en } from '@/i18n/en';

const respondWith = (status: number, body?: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected the call to fail');
    },
    (error: unknown) => error as ApiError,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createApiClient', () => {
  it('sends JSON and returns the parsed response', async () => {
    const fetchMock = respondWith(200, { requiresCode: false, email: 'me@example.com' });

    const response = await createApiClient().login({ email: 'me@example.com', password: 'secret' });

    expect(response).toEqual({ requiresCode: false, email: 'me@example.com' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({ email: 'me@example.com', password: 'secret' });
  });

  it('handles empty 204 responses', async () => {
    respondWith(204);
    await expect(createApiClient().deleteExpense('a')).resolves.toBeUndefined();
  });

  it('escapes ids in the URL', async () => {
    const fetchMock = respondWith(204);
    await createApiClient().deleteExpense('a/b');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/expenses/a%2Fb');
  });

  it('uses the detail from an error response', async () => {
    respondWith(401, { title: 'Unauthorized', detail: 'Incorrect email or password.' });
    const error = await failure(createApiClient().login({ email: 'a', password: 'b' }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Incorrect email or password.');
  });

  it('lists every field error from a validation response', async () => {
    respondWith(400, {
      title: 'One or more validation errors occurred.',
      errors: { amount: ['Amount is wrong.'], date: ['Date is wrong.'] },
    });
    const error = await failure(
      createApiClient().addExpense({ amount: 1, categoryId: 'a', date: '2026-11-05' }),
    );
    expect(error.message).toBe('Amount is wrong. Date is wrong.');
  });

  it('falls back to a generic message when an error has no readable body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);
    const error = await failure(createApiClient().getData());
    expect(error.status).toBe(502);
    expect(error.message).toBe(en.errors.generic);
  });

  it('reports status 0 when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await failure(createApiClient().getData());
    expect(error.status).toBe(0);
    expect(error.message).toBe(en.errors.network);
  });
});
