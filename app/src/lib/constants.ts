// Constantes da aplicação
export const APP_CONFIG = {
  name: 'UpRoom',
  version: '1.0.0',
  description: 'Plataforma de Comunicação Empresarial',
  author: 'UpRoom Team',
  supportEmail: 'support@uproom.com',
} as const;

// URLs da API
export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    SIGNOUT: '/auth/signout',
    PROFILE: '/auth/profile',
    SESSION: '/auth/session',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PASSWORD: '/auth/update-password',
  },
  COMPANIES: {
    LIST: '/companies',
    CREATE: '/companies',
    BY_ID: (id: string) => `/companies/${id}`,
    BY_SUBDOMAIN: (subdomain: string) => `/companies/subdomain/${subdomain}`,
    CHECK_SUBDOMAIN: (subdomain: string) => `/companies/check-subdomain/${subdomain}`,
    USER_COMPANIES: (userId: string) => `/companies/user/${userId}`,
  },
  CONVERSATIONS: {
    LIST: '/conversations',
    CREATE: '/conversations',
    BY_ID: (id: string) => `/conversations/${id}`,
    MESSAGES: (id: string) => `/conversations/${id}/messages`,
  },
  MESSAGES: {
    LIST: '/messages',
    CREATE: '/messages',
    BY_ID: (id: string) => `/messages/${id}`,
  },
  INVITATIONS: {
    LIST: '/invitations',
    CREATE: '/invitations',
    BY_ID: (id: string) => `/invitations/${id}`,
    ACCEPT: (id: string) => `/invitations/${id}/accept`,
    DECLINE: (id: string) => `/invitations/${id}/decline`,
  },
  USERS: {
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },
  PRESENCE: {
    UPDATE: '/presence',
    LIST: '/presence',
  },
} as const;

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Status de presença
export const PRESENCE_STATUS = {
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
} as const;

// Roles de usuário
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

// Tipos de conversa
export const CONVERSATION_TYPES = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

// Configurações de validação
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 2000,
  SUBDOMAIN_MIN_LENGTH: 3,
  SUBDOMAIN_MAX_LENGTH: 50,
} as const;

// Configurações de cache
export const CACHE_KEYS = {
  USER_PROFILE: 'user-profile',
  USER_COMPANIES: 'user-companies',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  PRESENCE: 'presence',
} as const;

// Configurações de debounce
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  TYPING: 1000,
  PRESENCE: 2000,
} as const;