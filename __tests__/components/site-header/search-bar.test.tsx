import React from 'react';
import { render, screen } from '@testing-library/react';
import { SearchBar } from '@/components/site-header/search-bar';

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/buscar ordens, clientes/i)).toBeInTheDocument();
  });
});
