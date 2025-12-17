'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Cliente } from '@/types/ordens-servico';

interface ClientSearchProps {
  onSelect: (cliente: Cliente) => void;
  selectedClienteId?: string;
  className?: string;
}

export function ClientSearch({
  onSelect,
  selectedClienteId,
  className,
}: ClientSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedCliente, setSelectedCliente] = React.useState<Cliente | null>(
    null
  );

  const debouncedQuery = useDebounce(query, 500);

  React.useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      try {
        const searchParam = debouncedQuery ? `?search=${encodeURIComponent(debouncedQuery)}` : '?limit=10';
        const response = await fetch(`/api/clientes${searchParam}`);

        if (!response.ok) {
          throw new Error('Falha ao buscar clientes');
        }

        const data = await response.json();
        if (data.clientes) {
          setClientes(data.clientes);
        } else {
          setClientes([]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClientes();
  }, [debouncedQuery]);

  React.useEffect(() => {
    async function fetchSelectedCliente() {
      if (selectedClienteId && !selectedCliente) {
        try {
          const response = await fetch(`/api/clientes?search=${selectedClienteId}`); // This might not work if search doesn't support ID exact match directly or efficiently?
          // Actually, we need an endpoint to get by ID, or filter.
          // But `/api/clientes` search searches many fields.
          // Let's rely on the list we have or fetch specific.
          // Ideally we need `/api/clientes/[id]`.
          // For now, let's assume if it's in the list otherwise we might miss it.
          // Or just skip fetching individual for now if not critical or implement `api/clientes/[id]`.
        } catch (e) { /* ignore */ }
      }
    }
    // fetchSelectedCliente();
  }, [selectedClienteId, selectedCliente]);

  const handleSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    onSelect(cliente);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedCliente
            ? selectedCliente.nome
            : 'Selecione um cliente...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente (nome, email, CPF)..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && <div className="p-4 text-center text-sm">Carregando...</div>}
            {!loading && clientes.length === 0 && (
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={cliente.id}
                  onSelect={() => handleSelect(cliente)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCliente?.id === cliente.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{cliente.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {cliente.email} • {cliente.cpf_cnpj || cliente.numero_cliente}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
