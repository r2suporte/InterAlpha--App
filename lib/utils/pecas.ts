/**
 * Utilitários gerais para manipulação de Peças
 */

import { StatusPeca } from '@/types/pecas';

/**
 * Determina o status do estoque baseado na quantidade atual e mínima
 */
export function determinarStatusEstoque(
    quantidade: number,
    estoqueMinimo: number
): StatusPeca {
    if (quantidade === 0) return 'sem_estoque';
    if (quantidade <= estoqueMinimo) return 'baixo_estoque';
    return 'disponivel';
}

/**
 * Valida o formato e regras de negócio de um Part Number
 */
export function validarPartNumber(partNumber: string): {
    isValid: boolean;
    message: string;
} {
    const MIN_LENGTH = 3;
    const MAX_LENGTH = 50;

    if (!partNumber || partNumber.trim().length === 0) {
        return { isValid: false, message: 'Part number é obrigatório' };
    }

    if (partNumber.length < MIN_LENGTH) {
        return {
            isValid: false,
            message: `Part number deve ter pelo menos ${MIN_LENGTH} caracteres`,
        };
    }

    if (partNumber.length > MAX_LENGTH) {
        return {
            isValid: false,
            message: `Part number não pode ter mais de ${MAX_LENGTH} caracteres`,
        };
    }

    // Validação de formato (letras, números, hífen, underscore)
    const partNumberRegex = /^[A-Za-z0-9\-_]+$/;
    if (!partNumberRegex.test(partNumber)) {
        return {
            isValid: false,
            message:
                'Part number deve conter apenas letras, números, hífen e underscore',
        };
    }

    return { isValid: true, message: 'Part number válido' };
}
