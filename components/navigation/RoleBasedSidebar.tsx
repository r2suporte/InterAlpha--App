'use client';

import * as React from 'react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { useAuth } from '@/hooks/use-permissions';
import getRoleBasedNavigation from './navigation-config';

export function RoleBasedSidebar({
  ...props
}: React.ComponentProps<typeof EnhancedSidebar>) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const navigation = getRoleBasedNavigation(user.role);

  // Para agora, continuamos usando o EnhancedSidebar padrão.
  // navigation pode ser passado ao EnhancedSidebar quando este aceitar props
  // com a estrutura de navegação.
  return <EnhancedSidebar {...props} />;
}
