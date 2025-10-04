import 'dotenv/config';
import { z } from 'zod';

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  DIRECT_URL: z.string().url().optional(),
  
  // Server
  PORT: z.coerce.number().min(1000).max(65535).default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // CORS
  CORS_ORIGIN: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),
});

// Validação e parsing das variáveis de ambiente
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      let errorMessage = '❌ Erro na configuração das variáveis de ambiente:\n\n';
      
      if (missingVars.length > 0) {
        errorMessage += `🔴 Variáveis obrigatórias não definidas:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n`;
      }
      
      if (invalidVars.length > 0) {
        errorMessage += `🟡 Variáveis com valores inválidos:\n${invalidVars.map(v => `  - ${v}`).join('\n')}\n\n`;
      }
      
      errorMessage += '💡 Configure essas variáveis no seu arquivo .env ou nas configurações do ambiente.';
      
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const config = parseEnv();

// Log das configurações (sem dados sensíveis)
if (config.NODE_ENV === 'development') {
  console.log('🔧 Configuração do ambiente carregada:');
  console.log(`  📍 NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  🚀 PORT: ${config.PORT}`);
  console.log(`  🌐 FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log(`  🔐 JWT_SECRET: ${config.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`  🗄️ DATABASE_URL: ${config.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`  🛡️ CORS_ORIGIN: ${config.CORS_ORIGIN ? '✅ Configurado' : '⚠️ Usando padrão'}`);
}
