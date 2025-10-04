import 'dotenv/config';
export declare const config: {
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    DATABASE_URL: string;
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    FRONTEND_URL: string;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_TIME_WINDOW: string;
    DIRECT_URL?: string | undefined;
    CORS_ORIGIN?: string | undefined;
};
//# sourceMappingURL=config.d.ts.map