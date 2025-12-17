/**
 * Utilitários para cálculos de preço e margem de lucro
 */

/**
 * Calcula a margem de lucro em porcentagem baseada no preço de custo e venda
 * @param precoCusto - Preço de custo do produto
 * @param precoVenda - Preço de venda do produto
 * @returns Margem de lucro em porcentagem
 */
export function calcularMargemLucro(
    precoCusto: number,
    precoVenda: number
): number {
    if (precoCusto === 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
}

/**
 * Calcula o preço de venda sugerido baseado no custo e margem desejada
 * @param precoCusto - Preço de custo do produto
 * @param margemLucro - Margem de lucro desejada em porcentagem
 * @returns Preço de venda sugerido
 */
export function calcularPrecoVenda(
    precoCusto: number,
    margemLucro: number
): number {
    return precoCusto * (1 + margemLucro / 100);
}

/**
 * Formata um valor numérico para moeda BRL
 * @param valor - Valor numérico
 * @returns String formatada (ex: R$ 10,00)
 */
export function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
}
