import { type ReactNode } from 'react';

/**
 * Layout do Dashboard
 * A autenticação é gerenciada pelo middleware.ts via Clerk.
 * Não é necessário verificar auth aqui — o middleware já protege 
 * todas as rotas /dashboard/* antes mesmo de chegar neste layout.
 */
export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
