import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

/**
 * Webhook handler for Clerk events
 * Synchronizes user data from Clerk to local database
 * 
 * Events handled:
 * - user.created: Creates new user in database
 * - user.updated: Updates existing user data
 * - user.deleted: Marks user as inactive
 */
export async function POST(req: Request) {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { error: 'Missing svix headers' },
            { status: 400 }
        );
    }

    // Get the body
    const payload = await req.text();
    const body = JSON.parse(payload);

    // Get the Webhook secret from environment
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('CLERK_WEBHOOK_SECRET is not set');
        return NextResponse.json(
            { error: 'Webhook secret not configured' },
            { status: 500 }
        );
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(payload, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Received Clerk webhook: ${eventType}`);

    try {
        switch (eventType) {
            case 'user.created':
                await handleUserCreated(evt);
                break;

            case 'user.updated':
                await handleUserUpdated(evt);
                break;

            case 'user.deleted':
                await handleUserDeleted(evt);
                break;

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ success: true, eventType });
    } catch (error) {
        console.error(`Error processing webhook ${eventType}:`, error);
        return NextResponse.json(
            { error: 'Error processing webhook', eventType },
            { status: 500 }
        );
    }
}

/**
 * Handle user.created event
 * Creates a new user in the local database
 */
async function handleUserCreated(evt: WebhookEvent) {
    if (evt.type !== 'user.created') return;

    const { id, email_addresses, first_name, last_name, public_metadata } =
        evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
        console.error('No email found for user:', id);
        return;
    }

    // Build user name
    const name =
        first_name && last_name
            ? `${first_name} ${last_name}`.trim()
            : first_name || last_name || email.split('@')[0];

    // Get role from public metadata, default to 'user'
    const role = (public_metadata?.role as string) || 'user';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User already exists: ${email}`);
        // Update the Clerk ID if different
        if (existingUser.id !== id) {
            await prisma.user.update({
                where: { email },
                data: { id },
            });
            console.log(`Updated Clerk ID for user: ${email}`);
        }
        return;
    }

    // Create new user
    await prisma.user.create({
        data: {
            id,
            email,
            name,
            role,
            isActive: true,
        },
    });

    console.log(`Created user: ${email} with role: ${role}`);
}

/**
 * Handle user.updated event
 * Updates existing user data in the local database
 */
async function handleUserUpdated(evt: WebhookEvent) {
    if (evt.type !== 'user.updated') return;

    const { id, email_addresses, first_name, last_name, public_metadata } =
        evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
        console.error('No email found for user:', id);
        return;
    }

    // Build user name
    const name =
        first_name && last_name
            ? `${first_name} ${last_name}`.trim()
            : first_name || last_name || email.split('@')[0];

    // Get role from public metadata
    const role = (public_metadata?.role as string) || 'user';

    // Update user
    await prisma.user.upsert({
        where: { id },
        update: {
            email,
            name,
            role,
        },
        create: {
            id,
            email,
            name,
            role,
            isActive: true,
        },
    });

    console.log(`Updated user: ${email}`);
}

/**
 * Handle user.deleted event
 * Marks user as inactive in the local database
 */
async function handleUserDeleted(evt: WebhookEvent) {
    if (evt.type !== 'user.deleted') return;

    const { id } = evt.data;

    if (!id) {
        console.error('No user ID found in delete event');
        return;
    }

    // Mark user as inactive instead of deleting
    // This preserves data integrity and audit trail
    await prisma.user.update({
        where: { id },
        data: {
            isActive: false,
        },
    });

    console.log(`Marked user as inactive: ${id}`);
}
