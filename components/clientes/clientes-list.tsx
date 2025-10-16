'use client';

import { useState } from 'react';

import {
  Building,
  Calendar,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Trash2,
  User,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataField, DataGrid } from '@/components/ui/data-display';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveTable,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SearchAndFilter } from '@/components/ui/search-and-filter';
import { StatusBadge } from '@/components/ui/status-badge';
import { type TipoPessoa, formatarCpfCnpj } from '@/lib/validators';

interface Cliente {
  id: string;
  numero_cliente: string | null;
  nome: string;
  email: string;
  email2?: string | null;
  email3?: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  cpf_cnpj: string | null;
  tipo_pessoa: TipoPessoa;
  observacoes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ClientesListProps {
  clientes: Cliente[];
  isLoading?: boolean;
  onEdit: (_cliente: Cliente) => void;
  onDelete: (_cliente: Cliente) => void;
  onView: (_cliente: Cliente) => void;
}

export function ClientesList({
  clientes,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
}: ClientesListProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Manter compatibilidade com filtros individuais
  const statusFilter = filters.status || 'all';
  const tipoFilter = filters.tipo || 'all';

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch =
      cliente.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      (!!cliente.email2 &&
        cliente.email2.toLowerCase().includes(searchValue.toLowerCase())) ||
      (!!cliente.email3 &&
        cliente.email3.toLowerCase().includes(searchValue.toLowerCase())) ||
      (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(searchValue));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cliente.is_active) ||
      (statusFilter === 'inactive' && !cliente.is_active);

    const matchesTipo =
      tipoFilter === 'all' || cliente.tipo_pessoa === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatEndereco = (cliente: Cliente) => {
    const parts = [cliente.endereco, cliente.cidade, cliente.estado].filter(
      Boolean
    );
    return parts.join(', ');
  };

  const ClienteActions = ({ cliente }: { cliente: Cliente }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(cliente)}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(cliente)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(cliente)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile Card View
  const MobileClienteCard = ({ cliente }: { cliente: Cliente }) => (
    <ResponsiveCard className="space-y-4" hover>
      <ResponsiveStack
        direction="horizontal"
        align="center"
        className="justify-between"
      >
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(cliente.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{cliente.nome}</h3>
            <p className="text-xs text-muted-foreground">
              #{cliente.numero_cliente || cliente.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge
            status={cliente.is_active ? 'active' : 'inactive'}
            size="sm"
          />
          <ClienteActions cliente={cliente} />
        </div>
      </ResponsiveStack>

      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{cliente.email}</span>
          </div>
          {cliente.email2 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{cliente.email2}</span>
            </div>
          )}
          {cliente.email3 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{cliente.email3}</span>
            </div>
          )}
          {cliente.telefone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{cliente.telefone}</span>
            </div>
          )}
          {formatEndereco(cliente) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{formatEndereco(cliente)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant={cliente.tipo_pessoa === 'fisica' ? 'default' : 'secondary'}
          >
            {cliente.tipo_pessoa === 'fisica' ? (
              <>
                <User className="mr-1 h-3 w-3" />
                Pessoa Física
              </>
            ) : (
              <>
                <Building className="mr-1 h-3 w-3" />
                Pessoa Jurídica
              </>
            )}
          </Badge>

          {cliente.cpf_cnpj && (
            <span className="text-xs text-muted-foreground">
              {formatarCpfCnpj(cliente.cpf_cnpj, cliente.tipo_pessoa)}
            </span>
          )}
        </div>
      </div>
    </ResponsiveCard>
  );

  // Desktop Table View
  const DesktopTable = () => (
    <ResponsiveTable>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Contato
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Criado em
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredClientes.map(cliente => (
            <tr key={cliente.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-xs text-blue-600">
                      {getInitials(cliente.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {cliente.nome}
                    </div>
                    <div className="text-sm text-gray-500">
                      #{cliente.numero_cliente || cliente.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{cliente.email}</span>
                  </div>
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{cliente.telefone}</span>
                    </div>
                  )}
                  {formatEndereco(cliente) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{formatEndereco(cliente)}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <Badge
                  variant={
                    cliente.tipo_pessoa === 'fisica' ? 'default' : 'secondary'
                  }
                >
                  {cliente.tipo_pessoa === 'fisica' ? (
                    <>
                      <User className="mr-1 h-3 w-3" />
                      PF
                    </>
                  ) : (
                    <>
                      <Building className="mr-1 h-3 w-3" />
                      PJ
                    </>
                  )}
                </Badge>
                {cliente.cpf_cnpj && (
                  <div className="mt-1 text-xs text-gray-500">
                    {formatarCpfCnpj(cliente.cpf_cnpj, cliente.tipo_pessoa)}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <StatusBadge
                  status={cliente.is_active ? 'active' : 'inactive'}
                  size="sm"
                />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <ClienteActions cliente={cliente} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResponsiveTable>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ResponsiveCard key={i} className="animate-pulse">
            <div className="h-20 rounded bg-gray-200"></div>
          </ResponsiveCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <SearchAndFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Buscar por nome, email ou documento..."
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ],
          },
          {
            key: 'tipo',
            label: 'Tipo',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'fisica', label: 'Pessoa Física' },
              { value: 'juridica', label: 'Pessoa Jurídica' },
            ],
          },
        ]}
      />

      {/* Lista */}
      {filteredClientes.length === 0 ? (
        <ResponsiveCard className="py-12 text-center">
          <div className="text-gray-500">
            <User className="mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">
              Nenhum cliente encontrado
            </h3>
            <p className="text-sm">
              {searchValue || statusFilter !== 'all' || tipoFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro cliente'}
            </p>
          </div>
        </ResponsiveCard>
      ) : (
        <>
          {/* Mobile View */}
          <ShowHide hide={['md', 'lg', 'xl']}>
            <ResponsiveGrid cols={{ sm: 1 }}>
              {filteredClientes.map(cliente => (
                <MobileClienteCard key={cliente.id} cliente={cliente} />
              ))}
            </ResponsiveGrid>
          </ShowHide>

          {/* Desktop View */}
          <ShowHide on={['md', 'lg', 'xl']}>
            <DesktopTable />
          </ShowHide>
        </>
      )}
    </div>
  );
}
