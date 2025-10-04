"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
// Validação das variáveis de ambiente obrigatórias
const requiredEnvVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
};
// Verificar se todas as variáveis obrigatórias estão definidas
const missingVars = [];
for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
        missingVars.push(key);
    }
}
if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please set these variables in your Railway environment settings:\n' +
        missingVars.map(varName => `- ${varName}`).join('\n'));
}
// Validação adicional para SUPABASE_URL
if (!requiredEnvVars.SUPABASE_URL.startsWith('https://')) {
    throw new Error('SUPABASE_URL must be a valid HTTPS URL starting with https://');
}
// Configurações com valores padrão
exports.env = {
    // Supabase
    SUPABASE_URL: requiredEnvVars.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    // Database
    DATABASE_URL: requiredEnvVars.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL || requiredEnvVars.DATABASE_URL,
    // Server
    PORT: parseInt(process.env.PORT || '3333'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    // Rate Limiting
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
};
// Log das configurações (sem dados sensíveis)
console.log('Environment configuration loaded:');
console.log(`- NODE_ENV: ${exports.env.NODE_ENV}`);
console.log(`- PORT: ${exports.env.PORT}`);
console.log(`- FRONTEND_URL: ${exports.env.FRONTEND_URL}`);
console.log(`- SUPABASE_URL: ${exports.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
console.log(`- DATABASE_URL: ${exports.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
//# sourceMappingURL=env.js.map