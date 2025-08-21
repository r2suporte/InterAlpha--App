import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '../ClientForm'

// Mock dos dados iniciais válidos
const validFormData = {
  nome: "João Silva",
  email: "joao@example.com",
  telefone: "(11) 99999-9999",
  documento: "529.982.247-25", // CPF válido formatado
  tipoDocumento: "CPF" as const,
  cep: "12345-678",
  endereco: "Rua Exemplo, 123",
  cidade: "São Paulo",
  estado: "SP",
  observacoes: "Teste observação"
}

describe('ClientForm', () => {
  // Test 1: Renderização do formulário
  it('should render all form fields correctly', () => {
    const mockSubmit = jest.fn()
    render(<ClientForm onSubmit={mockSubmit} />)

    // Verifica se todos os campos obrigatórios estão presentes
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cpf\/cnpj/i)).toBeInTheDocument()

    // Verifica se os campos opcionais estão presentes
    expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/estado/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/observações/i)).toBeInTheDocument()

    // Verifica se o botão de submit está presente
    expect(screen.getByRole('button', { name: /salvar cliente/i })).toBeInTheDocument()
  })

  // Test 2: Validação de campos obrigatórios
  it('should show validation errors for required fields', async () => {
    const mockSubmit = jest.fn()
    render(<ClientForm onSubmit={mockSubmit} />)

    // Tenta submeter o formulário vazio
    fireEvent.click(screen.getByRole('button', { name: /salvar cliente/i }))

    // Aguarda as mensagens de erro aparecerem
    await waitFor(() => {
      expect(screen.getByText(/nome deve ter no mínimo 3 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      expect(screen.getByText(/telefone deve ter no mínimo 10 dígitos/i)).toBeInTheDocument()
      expect(screen.getByText(/cpf ou cnpj inválido/i)).toBeInTheDocument()
    })

    // Verifica se o onSubmit não foi chamado
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  // Test 3: Submissão com dados válidos
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn().mockImplementation(() => Promise.resolve())
    const { getByLabelText, getByRole, findByText } = render(<ClientForm onSubmit={mockSubmit} />)

    // Preenche os campos obrigatórios com dados válidos
    await userEvent.type(getByLabelText(/nome/i), validFormData.nome)
    await userEvent.type(getByLabelText(/email/i), validFormData.email)
    await userEvent.type(getByLabelText(/telefone/i), validFormData.telefone)
    await userEvent.type(getByLabelText(/cpf\/cnpj/i), validFormData.documento)
    
    // Aguarda a validação dos campos
    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled()
    })

    // Submete o formulário
    await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

    // Verifica se o onSubmit foi chamado com os dados corretos
    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      nome: validFormData.nome,
      email: validFormData.email,
      telefone: validFormData.telefone,
      documento: validFormData.documento,
      tipoDocumento: "CPF"
    }))

    // Aguarda a mensagem de sucesso
    const successMessage = await findByText(/cliente salvo com sucesso/i)
    expect(successMessage).toBeInTheDocument()
  })

  // Testes auxiliares
  describe('Loading State', () => {
    it('should show skeleton loader when isLoading is true', () => {
      const mockSubmit = jest.fn()
      render(<ClientForm onSubmit={mockSubmit} isLoading={true} />)
      
      // Verifica se os skeletons estão presentes
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
      
      // Verifica se o formulário não está visível
      expect(screen.queryByRole('button', { name: /salvar cliente/i })).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error message when submission fails', async () => {
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Erro ao salvar cliente'))
      const { getByLabelText, getByRole, findByText } = render(<ClientForm onSubmit={mockSubmit} />)

      // Preenche campos obrigatórios
      await userEvent.type(getByLabelText(/nome/i), validFormData.nome)
      await userEvent.type(getByLabelText(/email/i), validFormData.email)
      await userEvent.type(getByLabelText(/telefone/i), validFormData.telefone)
      await userEvent.type(getByLabelText(/cpf\/cnpj/i), validFormData.documento)

      // Submete o formulário
      await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

      // Aguarda a mensagem de erro
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })

      const errorMessage = await findByText(/erro ao salvar cliente/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  describe('Document Type Detection', () => {
    it('should detect CPF type automatically', async () => {
      const mockSubmit = jest.fn()
      const { getByLabelText } = render(<ClientForm onSubmit={mockSubmit} />)
      
      // Simula entrada de CPF
      await userEvent.type(getByLabelText(/cpf\/cnpj/i), '52998224725')

      await waitFor(() => {
        expect(mockSubmit).not.toHaveBeenCalled()
        // O tipo deve ser definido automaticamente como CPF
        const form = getByLabelText(/cpf\/cnpj/i).closest('form')
        expect(form).toHaveFormValues(expect.objectContaining({
          tipoDocumento: 'CPF'
        }))
      })
    })

    it('should detect CNPJ type automatically', async () => {
      const mockSubmit = jest.fn()
      const { getByLabelText } = render(<ClientForm onSubmit={mockSubmit} />)
      
      // Simula entrada de CNPJ
      await userEvent.type(getByLabelText(/cpf\/cnpj/i), '45997418000153')

      await waitFor(() => {
        expect(mockSubmit).not.toHaveBeenCalled()
        // O tipo deve ser definido automaticamente como CNPJ
        const form = getByLabelText(/cpf\/cnpj/i).closest('form')
        expect(form).toHaveFormValues(expect.objectContaining({
          tipoDocumento: 'CNPJ'
        }))
      })
    })
  })

  describe('Address Fields Validation', () => {
    it('should validate CEP format', async () => {
      const mockSubmit = jest.fn()
      const { getByLabelText, getByRole } = render(<ClientForm onSubmit={mockSubmit} />)

      // Preenche campos obrigatórios
      await userEvent.type(getByLabelText(/nome/i), validFormData.nome)
      await userEvent.type(getByLabelText(/email/i), validFormData.email)
      await userEvent.type(getByLabelText(/telefone/i), validFormData.telefone)
      await userEvent.type(getByLabelText(/cpf\/cnpj/i), validFormData.documento)
      
      // Testa CEP inválido
      await userEvent.type(getByLabelText(/cep/i), '1234')
      
      // Submete o formulário
      await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

      await waitFor(() => {
        expect(screen.getByText(/cep deve ter 8 dígitos/i)).toBeInTheDocument()
        expect(mockSubmit).not.toHaveBeenCalled()
      })

      // Limpa e preenche com CEP válido
      await userEvent.clear(getByLabelText(/cep/i))
      await userEvent.type(getByLabelText(/cep/i), '12345678')
      
      // Submete novamente
      await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })

    it('should validate state format', async () => {
      const mockSubmit = jest.fn()
      const { getByLabelText, getByRole } = render(<ClientForm onSubmit={mockSubmit} />)

      // Preenche campos obrigatórios
      await userEvent.type(getByLabelText(/nome/i), validFormData.nome)
      await userEvent.type(getByLabelText(/email/i), validFormData.email)
      await userEvent.type(getByLabelText(/telefone/i), validFormData.telefone)
      await userEvent.type(getByLabelText(/cpf\/cnpj/i), validFormData.documento)
      
      // Testa estado inválido
      await userEvent.type(getByLabelText(/estado/i), 'SAO')
      
      // Submete o formulário
      await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

      await waitFor(() => {
        expect(screen.getByText(/estado deve ter 2 caracteres/i)).toBeInTheDocument()
        expect(mockSubmit).not.toHaveBeenCalled()
      })

      // Limpa e preenche com estado válido
      await userEvent.clear(getByLabelText(/estado/i))
      await userEvent.type(getByLabelText(/estado/i), 'SP')
      
      // Submete novamente
      await userEvent.click(getByRole('button', { name: /salvar cliente/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })
})
