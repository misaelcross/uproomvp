import 'dotenv/config';
interface EnvConfig {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_ANON_KEY: string;
    DATABASE_URL: string;
    DIRECT_URL: string;
    PORT: number;
    NODE_ENV: string;
    FRONTEND_URL: string;
    CORS_ORIGIN?: string;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_TIME_WINDOW: string;
}
export declare const env: EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map