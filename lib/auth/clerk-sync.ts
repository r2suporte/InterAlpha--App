import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * Synchronizes the current Clerk user with the local database
 * Creates a new user record if one doesn't exist
 * Returns the user from the database
 */
export async function syncClerkUserToDatabase() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
        return null;
    }

    // Check if user exists in local database
    let user = await prisma.user.findUnique({
        where: { email },
    });

    // Create user if doesn't exist
    if (!user) {
        const name = clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.lastName || email.split('@')[0];

        // Get role from Clerk public metadata, default to 'user'
        const role = (clerkUser.publicMetadata?.role as string) || 'user';

        user = await prisma.user.create({
            data: {
                id: clerkUser.id, // Use Clerk ID as primary key
                email,
                name,
                role,
            },
        });
    } else if (user.id !== clerkUser.id) {
        // Update user ID if it changed (migration scenario)
        user = await prisma.user.update({
            where: { email },
            data: { id: clerkUser.id },
        });
    }

    return user;
}

/**
 * Gets the current user from Clerk and syncs to database
 * Throws an error if user is not authenticated
 */
export async function requireUser() {
    const user = await syncClerkUserToDatabase();

    if (!user) {
        throw new Error('User not authenticated');
    }

    return user;
}
