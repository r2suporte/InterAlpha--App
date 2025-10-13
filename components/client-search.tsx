'use client';

import { useEffect, useState } from 'react';

import {
  Check,
  Hash,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  numero_cliente: string;
  created_at: string;
}

interface ClientSearchProps {
  onClientSelect: (client: Cliente) => void;
  onCreateNew: () => void;
  selectedClient?: Cliente | null;
}

export function ClientSearch({
  onClientSelect,
  onCreateNew,
  selectedClient,
}: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .or(
            `nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,numero_cliente.ilike.%${searchTerm}%`
          )
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Erro ao buscar clientes:', error);
          return;
        }

        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchClients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, supabase]);

  const handleClientSelect = (client: Cliente) => {
    onClientSelect(client);
    setShowResults(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onClientSelect(null as any);
    setSearchTerm('');
    setShowResults(false);
  };

  if (selectedClient) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <Hash className="mr-1 h-3 w-3" />
                {selectedClient.numero_cliente}
              </Badge>
              <Badge variant="outline" className="text-green-700">
                Cliente Selecionado
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{selectedClient.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {selectedClient.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {selectedClient.telefone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {selectedClient.endereco}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client-search">Buscar Cliente Existente</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="client-search"
            placeholder="Digite nome, e-mail, telefone ou número do cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {showResults && searchResults.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map((client, index) => (
                <div key={client.id}>
                  <div
                    className="cursor-pointer p-4 transition-colors hover:bg-blue-50"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Hash className="mr-1 h-3 w-3" />
                          {client.numero_cliente}
                        </Badge>
                        <span className="font-medium">{client.nome}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.telefone}
                      </div>
                    </div>
                    {client.endereco && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {client.endereco}
                      </div>
                    )}
                  </div>
                  {index < searchResults.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showResults &&
        searchResults.length === 0 &&
        searchTerm.length >= 2 &&
        !isSearching && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="mb-3 text-yellow-800">
                Nenhum cliente encontrado com "{searchTerm}"
              </p>
              <Button
                onClick={onCreateNew}
                variant="outline"
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Novo Cliente
              </Button>
            </CardContent>
          </Card>
        )}

      <div className="text-center">
        <Button onClick={onCreateNew} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Novo Cliente
        </Button>
      </div>
    </div>
  );
}
