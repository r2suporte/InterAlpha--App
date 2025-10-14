'use client';

import { useState } from 'react';

import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveText,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function CalculadoraPage() {
  const [valorCusto, setValorCusto] = useState('');
  const [margemLucro, setMargemLucro] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [tipoCalculo, setTipoCalculo] = useState('margem');
  const { isMobile } = useBreakpoint();

  const calcularValores = () => {
    const custo = parseFloat(valorCusto) || 0;
    const margem = parseFloat(margemLucro) || 0;

    if (tipoCalculo === 'margem' && custo > 0 && margem > 0) {
      const venda = custo * (1 + margem / 100);
      setValorVenda(venda.toFixed(2));
    } else if (tipoCalculo === 'markup' && custo > 0 && margem > 0) {
      const venda = custo + (custo * margem) / 100;
      setValorVenda(venda.toFixed(2));
    }
  };

  const calcularMargem = () => {
    const custo = parseFloat(valorCusto) || 0;
    const venda = parseFloat(valorVenda) || 0;

    if (custo > 0 && venda > 0) {
      const margem = ((venda - custo) / custo) * 100;
      setMargemLucro(margem.toFixed(2));
    }
  };

  const limparCalculos = () => {
    setValorCusto('');
    setMargemLucro('');
    setValorVenda('');
  };

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          {/* Header */}
          <div className="mb-4 flex items-center gap-4">
            <BackButton href="/dashboard" />
            <ResponsiveStack direction="vertical" className="space-y-2">
              <ResponsiveText
                size={isMobile ? '2xl' : '3xl'}
                className="font-bold tracking-tight"
              >
                Calculadora Financeira
              </ResponsiveText>
              <ResponsiveText
                size={isMobile ? 'sm' : 'base'}
                className="text-muted-foreground"
              >
                Calcule preços, margens de lucro e valores para seus serviços
              </ResponsiveText>
            </ResponsiveStack>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Calculadora Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora de Preços
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-calculo">Tipo de Cálculo</Label>
                  <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="margem">Margem de Lucro</SelectItem>
                      <SelectItem value="markup">Markup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-custo">Valor de Custo (R$)</Label>
                  <Input
                    id="valor-custo"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={valorCusto}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      setValorCusto(value);
                    }}
                    onBlur={calcularValores}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margem-lucro">
                    {tipoCalculo === 'margem'
                      ? 'Margem de Lucro (%)'
                      : 'Markup (%)'}
                  </Label>
                  <Input
                    id="margem-lucro"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={margemLucro}
                    onChange={e => setMargemLucro(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-venda">Valor de Venda (R$)</Label>
                  <Input
                    id="valor-venda"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valorVenda}
                    onChange={e => setValorVenda(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={calcularValores} className="flex-1">
                    Calcular Preço
                  </Button>
                  <Button
                    onClick={calcularMargem}
                    variant="outline"
                    className="flex-1"
                  >
                    Calcular Margem
                  </Button>
                  <Button onClick={limparCalculos} variant="outline">
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultados e Informações */}
            <div className="space-y-6">
              {/* Resumo dos Cálculos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumo dos Cálculos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Valor de Custo:
                      </span>
                      <span className="font-medium">
                        R${' '}
                        {valorCusto
                          ? parseFloat(valorCusto).toFixed(2)
                          : '0,00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Margem/Markup:
                      </span>
                      <span className="font-medium">
                        {margemLucro
                          ? parseFloat(margemLucro).toFixed(2)
                          : '0,00'}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Valor de Venda:
                      </span>
                      <span className="font-medium text-green-600">
                        R${' '}
                        {valorVenda
                          ? parseFloat(valorVenda).toFixed(2)
                          : '0,00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm text-muted-foreground">
                        Lucro Bruto:
                      </span>
                      <span className="font-medium text-blue-600">
                        R${' '}
                        {valorCusto && valorVenda
                          ? (
                              parseFloat(valorVenda) - parseFloat(valorCusto)
                            ).toFixed(2)
                          : '0,00'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calculadoras Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Margens Pré-definidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[20, 30, 40, 50, 60, 80, 100, 150].map(margem => (
                      <Button
                        key={margem}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMargemLucro(margem.toString());
                          setTipoCalculo('margem');
                        }}
                      >
                        {margem}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Dicas de Precificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      • <strong>Margem:</strong> Percentual sobre o custo
                    </li>
                    <li>
                      • <strong>Markup:</strong> Valor adicionado ao custo
                    </li>
                    <li>• Considere custos operacionais</li>
                    <li>• Analise a concorrência</li>
                    <li>• Avalie o valor percebido pelo cliente</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
