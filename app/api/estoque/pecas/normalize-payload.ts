type PecaNumericPayload = Record<string, unknown> & {
  quantidade?: unknown;
  minimo?: unknown;
  preco_custo?: unknown;
  preco_venda?: unknown;
};

export function normalizePecaNumericFields(payload: PecaNumericPayload): PecaNumericPayload {
  if (typeof payload.quantidade === 'string') {
    payload.quantidade = Number.parseInt(payload.quantidade, 10);
  }

  if (typeof payload.minimo === 'string') {
    payload.minimo = Number.parseInt(payload.minimo, 10);
  }

  if (typeof payload.preco_custo === 'string') {
    payload.preco_custo = Number.parseFloat(payload.preco_custo);
  }

  if (typeof payload.preco_venda === 'string') {
    payload.preco_venda = Number.parseFloat(payload.preco_venda);
  }

  return payload;
}
