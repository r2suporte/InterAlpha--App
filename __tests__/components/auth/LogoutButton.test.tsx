import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSignOut = jest.fn();
const mockPush = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  useClerk: () => ({
    signOut: mockSignOut,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import LogoutButton from '@/components/auth/LogoutButton';

describe('LogoutButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logout button with correct text', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  it('shows loading state when logout is in progress', async () => {
    mockSignOut.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LogoutButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.getByText('Saindo...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls Clerk signOut and redirects on successful logout', async () => {
    mockSignOut.mockImplementation(async callback => {
      callback();
    });

    render(<LogoutButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('handles unexpected errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSignOut.mockRejectedValue(new Error('Network error'));

    render(<LogoutButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro inesperado:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
