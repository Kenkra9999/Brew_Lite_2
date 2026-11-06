export class ApiError extends Error { constructor(message: string, public status: number, public code?: string) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('brewlite-token') : null;
  let response: Response;
  try { response = await fetch('/api' + path, {...options, cache:'no-store', headers: {'Content-Type':'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {}), ...options.headers}}); }
  catch { throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(Array.isArray(data.message) ? data.message.join('. ') : data.message || 'Yêu cầu chưa thực hiện được.', response.status, data.code);
  return data as T;
}
