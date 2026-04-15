import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        CLERK_SECRET_KEY: z.string().min(1),
        STRIPE_SECRET_KEY: z.string().min(1).optional(),
        STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
        TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
        TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
        TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
        RESEND_API_KEY: z.string().min(1).optional(),
    },
    client: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
        NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    },
    experimental__runtimeEnv: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
});
