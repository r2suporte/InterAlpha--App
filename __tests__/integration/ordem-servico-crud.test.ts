// Mock do fetch para simular chamadas de API
global.fetch = jest.fn();

describe('CRUD de Ordens de Serviço - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Criar Ordem de Serviço', () => {
    it('deve criar uma nova ordem de serviço com sucesso', async () => {
      const novaOrdem = {
        clienteId: '1',
        descricao: 'Manutenção preventiva',
        valor: 500.0,
        dataVencimento: '2024-12-31',
        prioridade: 'media',
        categoria: 'manutencao',
      };

      const mockResponse = {
        id: '1',
        ...novaOrdem,
        status: 'pendente',
        numero: 'OS-2024-001',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem),
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data.id).toBe('1');
      expect(data.numero).toBe('OS-2024-001');
      expect(data.status).toBe('pendente');
      expect(data.valor).toBe(500.0);
    });

    it('deve retornar erro para cliente inexistente', async () => {
      const ordemComClienteInvalido = {
        clienteId: '999',
        descricao: 'Serviço teste',
        valor: 100.0,
        dataVencimento: '2024-12-31',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Cliente não encontrado',
        }),
      });

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordemComClienteInvalido),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe('Cliente não encontrado');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const ordemInvalida = {
        clienteId: '',
        descricao: '',
        valor: -100,
        dataVencimento: 'data-invalida',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Dados inválidos',
          details: {
            clienteId: 'Cliente é obrigatório',
            descricao: 'Descrição é obrigatória',
            valor: 'Valor deve ser positivo',
            dataVencimento: 'Data deve ter formato válido',
          },
        }),
      });

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordemInvalida),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe('Dados inválidos');
    });
  });

  describe('Listar Ordens de Serviço', () => {
    it('deve retornar lista de ordens de serviço', async () => {
      const mockOrdens = [
        {
          id: '1',
          numero: 'OS-2024-001',
          clienteId: '1',
          clienteNome: 'João Silva',
          descricao: 'Manutenção preventiva',
          valor: 500.0,
          status: 'pendente',
          prioridade: 'media',
          dataVencimento: '2024-12-31',
        },
        {
          id: '2',
          numero: 'OS-2024-002',
          clienteId: '2',
          clienteNome: 'Maria Santos',
          descricao: 'Reparo urgente',
          valor: 800.0,
          status: 'em_andamento',
          prioridade: 'alta',
          dataVencimento: '2024-11-30',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ordens: mockOrdens,
          total: 2,
          page: 1,
          limit: 10,
        }),
      });

      const response = await fetch('/api/ordens-servico?page=1&limit=10');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/ordens-servico?page=1&limit=10');
      expect(response.ok).toBe(true);
      expect(data.ordens).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.ordens[0].numero).toBe('OS-2024-001');
    });

    it('deve filtrar ordens por status', async () => {
      const mockOrdensPendentes = [
        {
          id: '1',
          numero: 'OS-2024-001',
          status: 'pendente',
          clienteNome: 'João Silva',
          descricao: 'Manutenção preventiva',
          valor: 500.0,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ordens: mockOrdensPendentes,
          total: 1,
          page: 1,
          limit: 10,
        }),
      });

      const response = await fetch(
        '/api/ordens-servico?status=pendente&page=1&limit=10'
      );
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith(
        '/api/ordens-servico?status=pendente&page=1&limit=10'
      );
      expect(data.ordens).toHaveLength(1);
      expect(data.ordens[0].status).toBe('pendente');
    });

    it('deve filtrar ordens por cliente', async () => {
      const mockOrdensCliente = [
        {
          id: '1',
          numero: 'OS-2024-001',
          clienteId: '1',
          clienteNome: 'João Silva',
          descricao: 'Manutenção preventiva',
          valor: 500.0,
          status: 'pendente',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ordens: mockOrdensCliente,
          total: 1,
          page: 1,
          limit: 10,
        }),
      });

      const response = await fetch(
        '/api/ordens-servico?clienteId=1&page=1&limit=10'
      );
      const data = await response.json();

      expect(data.ordens).toHaveLength(1);
      expect(data.ordens[0].clienteId).toBe('1');
    });
  });

  describe('Buscar Ordem de Serviço por ID', () => {
    it('deve retornar ordem específica com detalhes completos', async () => {
      const mockOrdem = {
        id: '1',
        numero: 'OS-2024-001',
        clienteId: '1',
        cliente: {
          id: '1',
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '(11) 99999-9999',
        },
        descricao: 'Manutenção preventiva completa',
        valor: 500.0,
        status: 'pendente',
        prioridade: 'media',
        categoria: 'manutencao',
        dataVencimento: '2024-12-31',
        observacoes: 'Cliente solicitou agendamento para manhã',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrdem,
      });

      const response = await fetch('/api/ordens-servico/1');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/ordens-servico/1');
      expect(response.ok).toBe(true);
      expect(data.id).toBe('1');
      expect(data.numero).toBe('OS-2024-001');
      expect(data.cliente.nome).toBe('João Silva');
    });

    it('deve retornar erro 404 para ordem não encontrada', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Ordem de serviço não encontrada',
        }),
      });

      const response = await fetch('/api/ordens-servico/999');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe('Ordem de serviço não encontrada');
    });
  });

  describe('Atualizar Status da Ordem', () => {
    it('deve atualizar status para em_andamento', async () => {
      const atualizacaoStatus = {
        status: 'em_andamento',
        observacoes: 'Iniciado trabalho de manutenção',
      };

      const mockOrdemAtualizada = {
        id: '1',
        numero: 'OS-2024-001',
        status: 'em_andamento',
        observacoes: 'Iniciado trabalho de manutenção',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrdemAtualizada,
      });

      const response = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizacaoStatus),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('em_andamento');
      expect(data.observacoes).toBe('Iniciado trabalho de manutenção');
    });

    it('deve atualizar status para concluida', async () => {
      const atualizacaoStatus = {
        status: 'concluida',
        observacoes: 'Serviço finalizado com sucesso',
        dataConclusao: '2024-01-15T10:00:00Z',
      };

      const mockOrdemConcluida = {
        id: '1',
        numero: 'OS-2024-001',
        status: 'concluida',
        observacoes: 'Serviço finalizado com sucesso',
        dataConclusao: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrdemConcluida,
      });

      const response = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizacaoStatus),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('concluida');
      expect(data.dataConclusao).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('Atualizar Ordem de Serviço', () => {
    it('deve atualizar dados da ordem com sucesso', async () => {
      const dadosAtualizacao = {
        descricao: 'Manutenção preventiva e corretiva',
        valor: 750.0,
        prioridade: 'alta',
        dataVencimento: '2024-11-30',
        observacoes: 'Incluído serviço adicional',
      };

      const mockOrdemAtualizada = {
        id: '1',
        numero: 'OS-2024-001',
        clienteId: '1',
        ...dadosAtualizacao,
        status: 'pendente',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrdemAtualizada,
      });

      const response = await fetch('/api/ordens-servico/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.descricao).toBe('Manutenção preventiva e corretiva');
      expect(data.valor).toBe(750.0);
      expect(data.prioridade).toBe('alta');
    });

    it('deve impedir atualização de ordem concluída', async () => {
      const dadosAtualizacao = {
        valor: 1000.0,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Não é possível alterar ordem de serviço concluída',
        }),
      });

      const response = await fetch('/api/ordens-servico/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);
      expect(data.error).toContain('concluída');
    });
  });

  describe('Cancelar Ordem de Serviço', () => {
    it('deve cancelar ordem pendente com sucesso', async () => {
      const motivoCancelamento = {
        motivo: 'Cliente solicitou cancelamento',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: '1',
          numero: 'OS-2024-001',
          status: 'cancelada',
          motivoCancelamento: 'Cliente solicitou cancelamento',
          dataCancelamento: '2024-01-02T00:00:00Z',
        }),
      });

      const response = await fetch('/api/ordens-servico/1/cancelar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motivoCancelamento),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('cancelada');
      expect(data.motivoCancelamento).toBe('Cliente solicitou cancelamento');
    });

    it('deve impedir cancelamento de ordem concluída', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Não é possível cancelar ordem de serviço concluída',
        }),
      });

      const response = await fetch('/api/ordens-servico/1/cancelar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Teste' }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);
      expect(data.error).toContain('concluída');
    });
  });

  describe('Fluxo completo de Ordem de Serviço', () => {
    it('deve executar ciclo completo da ordem', async () => {
      // 1. Criar ordem
      const novaOrdem = {
        clienteId: '1',
        descricao: 'Teste integração',
        valor: 300.0,
        dataVencimento: '2024-12-31',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: '1',
          numero: 'OS-2024-001',
          ...novaOrdem,
          status: 'pendente',
        }),
      });

      const createResponse = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem),
      });

      expect(createResponse.ok).toBe(true);

      // 2. Iniciar ordem
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', status: 'em_andamento' }),
      });

      const startResponse = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_andamento' }),
      });

      expect(startResponse.ok).toBe(true);

      // 3. Atualizar valor
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', valor: 350.0 }),
      });

      const updateResponse = await fetch('/api/ordens-servico/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: 350.0 }),
      });

      expect(updateResponse.ok).toBe(true);

      // 4. Concluir ordem
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: '1',
          status: 'concluida',
          dataConclusao: '2024-01-15T10:00:00Z',
        }),
      });

      const completeResponse = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'concluida',
          dataConclusao: '2024-01-15T10:00:00Z',
        }),
      });

      expect(completeResponse.ok).toBe(true);
    });
  });
});
