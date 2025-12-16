import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Available user roles in the system
 */
export const ROLES = {
    DIRETOR: 'diretor',
    GERENTE_ADMINISTRATIVO: 'gerente_administrativo',
    GERENTE_FINANCEIRO: 'gerente_financeiro',
    SUPERVISOR_TECNICO: 'supervisor_tecnico',
    TECNICO: 'tecnico',
    ATENDENTE: 'atendente',
    USER: 'user', // Default role
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: UserRole[] = [
    ROLES.USER,
    ROLES.ATENDENTE,
    ROLES.TECNICO,
    ROLES.SUPERVISOR_TECNICO,
    ROLES.GERENTE_FINANCEIRO,
    ROLES.GERENTE_ADMINISTRATIVO,
    ROLES.DIRETOR,
];

/**
 * Get the current user's role from Clerk metadata
 */
export async function getCurrentUserRole(): Promise<UserRole> {
    const user = await currentUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const role = (user.publicMetadata?.role as UserRole) || ROLES.USER;
    return role;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
    try {
        const userRole = await getCurrentUserRole();
        return userRole === requiredRole;
    } catch {
        return false;
    }
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
    try {
        const userRole = await getCurrentUserRole();
        return requiredRoles.includes(userRole);
    } catch {
        return false;
    }
}

/**
 * Check if user has at least the minimum required role level
 * Uses role hierarchy for comparison
 */
export async function hasMinimumRole(minimumRole: UserRole): Promise<boolean> {
    try {
        const userRole = await getCurrentUserRole();
        const userLevel = ROLE_HIERARCHY.indexOf(userRole);
        const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);

        return userLevel >= requiredLevel;
    } catch {
        return false;
    }
}

/**
 * Require user to have a specific role
 * Throws error if user doesn't have the role
 */
export async function requireRole(allowedRoles: UserRole[]) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized: User not authenticated');
    }

    const userRole = await getCurrentUserRole();

    if (!allowedRoles.includes(userRole)) {
        throw new Error(
            `Forbidden: User role '${userRole}' not authorized. Required: ${allowedRoles.join(', ')}`
        );
    }

    return { userId, role: userRole };
}

/**
 * Require user to have at least the minimum role level
 * Throws error if user doesn't meet the requirement
 */
export async function requireMinimumRole(minimumRole: UserRole) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized: User not authenticated');
    }

    const userRole = await getCurrentUserRole();
    const userLevel = ROLE_HIERARCHY.indexOf(userRole);
    const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);

    if (userLevel < requiredLevel) {
        throw new Error(
            `Forbidden: User role '${userRole}' insufficient. Minimum required: '${minimumRole}'`
        );
    }

    return { userId, role: userRole };
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
        [ROLES.DIRETOR]: 'Diretor',
        [ROLES.GERENTE_ADMINISTRATIVO]: 'Gerente Administrativo',
        [ROLES.GERENTE_FINANCEIRO]: 'Gerente Financeiro',
        [ROLES.SUPERVISOR_TECNICO]: 'Supervisor Técnico',
        [ROLES.TECNICO]: 'Técnico',
        [ROLES.ATENDENTE]: 'Atendente',
        [ROLES.USER]: 'Usuário',
    };

    return displayNames[role] || role;
}

/**
 * Check if a role can manage another role
 * Based on hierarchy
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = ROLE_HIERARCHY.indexOf(managerRole);
    const targetLevel = ROLE_HIERARCHY.indexOf(targetRole);

    return managerLevel > targetLevel;
}
