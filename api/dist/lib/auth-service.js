"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./database");
const config_1 = require("./config");
class AuthService {
    static JWT_SECRET = config_1.config.JWT_SECRET;
    static JWT_EXPIRES_IN = config_1.config.JWT_EXPIRES_IN;
    /**
     * Hash password
     */
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
    /**
     * Verify password
     */
    static async verifyPassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    /**
     * Generate JWT token
     */
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: '7d'
        });
    }
    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    /**
     * Sign up new user
     */
    static async signUp(email, password, fullName) {
        try {
            // Check if user already exists
            const existingUser = await database_1.prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return {
                    success: false,
                    error: 'User with this email already exists'
                };
            }
            // Hash password
            const hashedPassword = await this.hashPassword(password);
            // Create user
            const user = await database_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName
                }
            });
            const authUser = {
                id: user.id,
                email: user.email,
                fullName: user.fullName || undefined,
                avatar: user.avatar || undefined
            };
            const token = this.generateToken(authUser);
            return {
                success: true,
                user: authUser,
                token
            };
        }
        catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: 'Failed to create user account'
            };
        }
    }
    /**
     * Sign in user
     */
    static async signIn(email, password) {
        try {
            // Find user
            const user = await database_1.prisma.user.findUnique({
                where: { email }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            const authUser = {
                id: user.id,
                email: user.email,
                fullName: user.fullName || undefined,
                avatar: user.avatar || undefined
            };
            const token = this.generateToken(authUser);
            return {
                success: true,
                user: authUser,
                token
            };
        }
        catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: 'Failed to sign in'
            };
        }
    }
    /**
     * Get user by token
     */
    static async getUserByToken(token) {
        try {
            const decoded = this.verifyToken(token);
            if (!decoded)
                return null;
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId }
            });
            if (!user)
                return null;
            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName || undefined,
                avatar: user.avatar || undefined
            };
        }
        catch (error) {
            console.error('Get user by token error:', error);
            return null;
        }
    }
    /**
     * Reset password
     */
    static async resetPassword(email) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            // Generate reset token
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, this.JWT_SECRET, { expiresIn: '1h' });
            // TODO: Send reset email with token
            console.log('Reset token for', email, ':', resetToken);
            return { success: true };
        }
        catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: 'Failed to reset password'
            };
        }
    }
    /**
     * Update password
     */
    static async updatePassword(userId, newPassword) {
        try {
            const hashedPassword = await this.hashPassword(newPassword);
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
            return { success: true };
        }
        catch (error) {
            console.error('Update password error:', error);
            return {
                success: false,
                error: 'Failed to update password'
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map