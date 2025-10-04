export interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    avatar?: string;
}
export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    token?: string;
    error?: string;
}
export declare class AuthService {
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    /**
     * Hash password
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Verify password
     */
    static verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    /**
     * Generate JWT token
     */
    static generateToken(user: AuthUser): string;
    /**
     * Verify JWT token
     */
    static verifyToken(token: string): {
        userId: string;
        email: string;
    } | null;
    /**
     * Sign up new user
     */
    static signUp(email: string, password: string, fullName?: string): Promise<AuthResult>;
    /**
     * Sign in user
     */
    static signIn(email: string, password: string): Promise<AuthResult>;
    /**
     * Get user by token
     */
    static getUserByToken(token: string): Promise<AuthUser | null>;
    /**
     * Reset password
     */
    static resetPassword(email: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update password
     */
    static updatePassword(userId: string, newPassword: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=auth-service.d.ts.map