import { NextRequest, NextResponse } from 'next/server';
import { checkRolePermission } from './role-middleware';
import type { UserRole } from './permissions';

type AuthorizationSuccess = {
  authorized: true;
  user: NonNullable<Awaited<ReturnType<typeof checkRolePermission>>['user']>;
};

type AuthorizationFailure = {
  authorized: false;
  response: NextResponse;
};

export async function authorizeApiRequest(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthorizationSuccess | AuthorizationFailure> {
  const auth = await checkRolePermission(request);
  if (!auth.authenticated || !auth.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    };
  }

  return { authorized: true, user: auth.user };
}
