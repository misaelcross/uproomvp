"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = exports.disconnectDatabase = exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const config_1 = require("./config");
// Configuração otimizada do Prisma Client
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        datasources: {
            db: {
                url: config_1.config.DATABASE_URL,
            },
        },
        log: config_1.config.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        errorFormat: 'pretty',
    });
};
// Reutilizar instância em desenvolvimento para evitar múltiplas conexões
exports.prisma = globalThis.__prisma || createPrismaClient();
if (config_1.config.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
// Graceful shutdown
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        console.log('🔌 Conexão com banco de dados encerrada');
    }
    catch (error) {
        console.error('❌ Erro ao desconectar do banco:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Health check do banco
const checkDatabaseHealth = async () => {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('❌ Erro na conexão com banco:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
//# sourceMappingURL=database.js.map