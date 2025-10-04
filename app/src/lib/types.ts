export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatar: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  description: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  userRole?: UserRole;
  isOwner?: boolean;
}

export interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  user: User;
  company: Company;
}

export interface Conversation {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  companyId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  company: Company;
  createdBy: User;
  messages?: Message[];
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  user: User;
  conversation: Conversation;
}

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  userId: string;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  conversation: Conversation;
  replyTo?: Message;
  replies?: Message[];
}

export interface Invitation {
  id: string;
  email: string;
  companyId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  expiresAt: Date;
  createdAt: Date;
  company: Company;
}

export interface UserPresence {
  id: string;
  userId: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  message: string | null;
  lastSeen: Date;
  user: User;
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  fullName?: string;
}

export interface CreateCompanyForm {
  name: string;
  subdomain: string;
  description?: string;
}

export interface CreateConversationForm {
  title: string;
  description?: string;
  isPrivate: boolean;
}

export interface CreateMessageForm {
  content: string;
  conversationId: string;
  replyToId?: string;
}

export interface CreateInvitationForm {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseApiOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (data: SignInForm) => Promise<void>;
  signUp: (data: SignUpForm) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  setCurrentCompany: (company: Company | null) => void;
  createCompany: (data: CreateCompanyForm) => Promise<void>;
  updateCompany: (id: string, data: Partial<CreateCompanyForm>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
