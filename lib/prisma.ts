import { PrismaClient } from '@prisma/client';
import { envServer } from '@/lib/config/env.server';

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: envServer.neon.databaseUrl()
            }
        }
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
