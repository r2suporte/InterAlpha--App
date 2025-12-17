import React from 'react';
import {
    AlertCircle,
    Trash2,
} from 'lucide-react';
import { formatarMoeda } from '../types/financeiro';
import { Peca } from '../types/pecas';
import { PecaUtilizada } from '../types/ordens-servico';

interface PecaSelecionada extends PecaUtilizada {
    peca?: Peca;
    margem_lucro?: number;
}

interface PecaItemProps {
    peca: PecaSelecionada;
    index: number;
    readonly: boolean;
    onRemove: (index: number) => void;
    onUpdateQuantidade: (index: number, quantidade: number) => void;
    onUpdatePreco: (index: number, preco: number) => void;
    onUpdateCodigoApple: (index: number, codigo: string) => void;
    onUpdateTipoPeca: (index: number, tipo: string) => void;
}

export const PecaItem = React.memo(({
    peca,
    index,
    readonly,
    onRemove,
    onUpdateQuantidade,
    onUpdatePreco,
    onUpdateCodigoApple,
    onUpdateTipoPeca,
}: PecaItemProps) => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{peca.nome}</h4>
                        {peca.codigo_peca && (
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                {peca.codigo_peca}
                            </span>
                        )}
                        {peca.codigo_apple && (
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                Apple: {peca.codigo_apple}
                            </span>
                        )}
                        {peca.tipo_peca && (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                {peca.tipo_peca}
                            </span>
                        )}
                    </div>

                    {/* Campos específicos da Apple */}
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Código Apple
                            </label>
                            <input
                                type="text"
                                value={peca.codigo_apple || ''}
                                onChange={e => onUpdateCodigoApple(index, e.target.value)}
                                disabled={readonly}
                                placeholder="Ex: 661-12345"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tipo de Peça
                            </label>
                            <select
                                value={peca.tipo_peca || ''}
                                onChange={e => onUpdateTipoPeca(index, e.target.value)}
                                disabled={readonly}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Selecione o tipo</option>
                                <option value="original_apple">Original Apple</option>
                                <option value="compativel">Compatível</option>
                                <option value="recondicionada">Recondicionada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Quantidade
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={peca.quantidade}
                                onChange={e =>
                                    onUpdateQuantidade(
                                        index,
                                        Number.parseInt(e.target.value, 10) || 1
                                    )
                                }
                                disabled={readonly}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Preço Unitário
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={peca.valor_unitario}
                                onChange={e =>
                                    onUpdatePreco(index, parseFloat(e.target.value) || 0)
                                }
                                disabled={readonly}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Total
                            </label>
                            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                                {formatarMoeda(peca.valor_total)}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Margem
                            </label>
                            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                                {peca.margem_lucro
                                    ? `${peca.margem_lucro.toFixed(1)}%`
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    {peca.peca &&
                        peca.quantidade > peca.peca.quantidade_estoque && (
                            <div className="mt-2 flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">
                                    Quantidade solicitada ({peca.quantidade}) excede estoque
                                    disponível ({peca.peca.quantidade_estoque})
                                </span>
                            </div>
                        )}
                </div>

                {!readonly && (
                    <button
                        onClick={() => onRemove(index)}
                        className="ml-4 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
});

PecaItem.displayName = 'PecaItem';
