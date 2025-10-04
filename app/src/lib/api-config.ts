/**
 * Configuração centralizada da API
 * Garante que a URL seja normalizada (sem barra no final)
 */
export const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  return baseUrl.replace(/\/$/, '');
};

export const API_URL = getApiUrl();
