import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const checkDatabaseHealth: () => Promise<boolean>;
//# sourceMappingURL=database.d.ts.map