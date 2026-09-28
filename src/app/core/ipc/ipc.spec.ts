import { fail, ok, pretendTauri } from '../testing/fake-backend';
import { IpcError, unwrap } from './ipc';

describe('unwrap', () => {
  beforeEach(pretendTauri);

  it('returns data on success', async () => {
    await expect(unwrap(ok(42))).resolves.toBe(42);
  });

  it('throws IpcError with the backend code', async () => {
    const error = (await unwrap(fail('LIBRARY_NOT_FOUND', 'Biblioteca não encontrada.')).catch((e) => e)) as IpcError;
    expect(error).toBeInstanceOf(IpcError);
    expect(error.code).toBe('LIBRARY_NOT_FOUND');
    expect(error.message).toBe('Biblioteca não encontrada.');
  });
});
