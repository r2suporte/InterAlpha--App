/**
 * Testes para lib/utils.ts
 * Testando funções utilitárias de classe CSS (cn)
 */

import { cn } from '../../../lib/utils';

describe('lib/utils', () => {
  describe('cn', () => {
    it('deve combinar classes simples', () => {
      const result = cn('px-2', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('deve remover classes duplicadas mantendo a última', () => {
      // twMerge remove classes conflitantes, mantendo a última
      const result = cn('px-2', 'px-4');
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
    });

    it('deve aceitar arrays de classes', () => {
      const result = cn(['px-2', 'py-1']);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('deve aceitar objetos com classes condicionais', () => {
      const result = cn({
        'px-2': true,
        'py-1': false,
      });
      expect(result).toContain('px-2');
      expect(result).not.toContain('py-1');
    });

    it('deve mesclar tailwind classes corretamente', () => {
      const result = cn('text-red-500', 'text-blue-500');
      // twMerge mantém apenas a última cor
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('deve lidar com classes vazias', () => {
      const result = cn('', 'px-2', '');
      expect(result).toContain('px-2');
    });

    it('deve aceitar múltiplos tipos de entrada', () => {
      const result = cn(
        'px-2',
        { 'py-1': true },
        ['bg-white'],
        undefined,
        false,
        null
      );
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('bg-white');
    });

    it('deve preservar classes com espaços em branco', () => {
      const result = cn('  px-2  ', '  py-1  ');
      expect(result).toBeTruthy();
    });

    it('deve trabalhar com classes complexas', () => {
      const result = cn(
        'flex',
        'items-center',
        'justify-between',
        'p-4',
        'rounded-lg',
        'bg-gray-100'
      );
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('p-4');
      expect(result).toContain('rounded-lg');
      expect(result).toContain('bg-gray-100');
    });
  });
});
