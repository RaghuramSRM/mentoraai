const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getToken = () => localStorage.getItem('mentora_token');
export const setToken = (token: string) => localStorage.setItem('mentora_token', token);
export const clearToken = () => localStorage.removeItem('mentora_token');

export async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {'Content-Type':'application/json', ...(options.headers as Record<string,string> || {})};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {...options, headers});
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Something went wrong');
  }
  return response.json();
}
