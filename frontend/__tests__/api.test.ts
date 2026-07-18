import { apiRequest } from '../lib/api';

// Mock fetch
global.fetch = jest.fn();

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: { access_token: 'fake-token' }
        }
      })
    }
  }
}));

describe('apiRequest', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adds the authorization header correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await apiRequest('/test');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toEqual({ success: true });
  });

  it('throws an error on non-ok responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    await expect(apiRequest('/test')).rejects.toThrow('API error 500: Internal Server Error');
  });
});
