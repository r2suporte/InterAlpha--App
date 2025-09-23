import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogoutButton from '@/components/auth/LogoutButton'

// Mock do Supabase client
const mockSignOut = jest.fn()
const mockPush = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('LogoutButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders logout button with correct text', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('shows loading state when logout is in progress', async () => {
    mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LogoutButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    expect(screen.getByText('Saindo...')).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('calls supabase signOut and redirects on successful logout', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    
    render(<LogoutButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('handles logout error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSignOut.mockResolvedValue({ error: { message: 'Logout failed' } })
    
    render(<LogoutButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao fazer logout:', { message: 'Logout failed' })
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('handles unexpected errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSignOut.mockRejectedValue(new Error('Network error'))
    
    render(<LogoutButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro inesperado:', expect.any(Error))
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('returns to normal state after logout completes', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    
    render(<LogoutButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Sair')).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })
  })
})