import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../../services/apiClient';

// Mock fetch
global.fetch = vi.fn();

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('makes successful GET request', async () => {
    const mockResponse = {
      data: { id: '1', name: 'Test Person' },
      success: true,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await apiClient.get('/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('handles API errors correctly', async () => {
    const errorResponse = {
      message: 'Not Found',
      code: 'NOT_FOUND',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => errorResponse,
    } as Response);

    await expect(apiClient.get('/nonexistent')).rejects.toThrow(ApiError);
  });

  it('retries failed requests', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success', success: true }),
      } as Response);

    const result = await apiClient.get('/test');

    expect(result.data).toBe('success');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('times out requests', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves
    );

    await expect(apiClient.get('/slow')).rejects.toThrow();
  });
});
