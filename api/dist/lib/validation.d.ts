import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const nameSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName?: string | undefined;
}, {
    email: string;
    password: string;
    fullName?: string | undefined;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const updatePasswordSchema: z.ZodObject<{
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
}, {
    password: string;
}>;
export declare const createCompanySchema: z.ZodObject<{
    name: z.ZodString;
    subdomain: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    subdomain: string;
    description?: string | undefined;
}, {
    name: string;
    subdomain: string;
    description?: string | undefined;
}>;
export declare const updateCompanySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
}>;
export declare const createConversationSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isPrivate: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    isPrivate: boolean;
    description?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    isPrivate?: boolean | undefined;
}>;
export declare const updateConversationSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isPrivate: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    isPrivate?: boolean | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    isPrivate?: boolean | undefined;
}>;
export declare const createMessageSchema: z.ZodObject<{
    content: z.ZodString;
    conversationId: z.ZodString;
    replyToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    conversationId: string;
    replyToId?: string | undefined;
}, {
    content: string;
    conversationId: string;
    replyToId?: string | undefined;
}>;
export declare const updateMessageSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const createInvitationSchema: z.ZodObject<{
    email: z.ZodString;
    companyId: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["MEMBER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    companyId: string;
    role: "MEMBER" | "ADMIN";
}, {
    email: string;
    companyId: string;
    role?: "MEMBER" | "ADMIN" | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    avatar?: string | undefined;
}, {
    fullName?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const updatePresenceSchema: z.ZodObject<{
    status: z.ZodEnum<["ONLINE", "AWAY", "BUSY", "OFFLINE"]>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
    message?: string | undefined;
}, {
    status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
    message?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const validateData: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
//# sourceMappingURL=validation.d.ts.map