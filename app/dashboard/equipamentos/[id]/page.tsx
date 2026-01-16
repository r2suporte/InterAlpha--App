'use client';

import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Wrench,
    History,
    User,
    Calendar,
    FileText,
    ArrowLeft,
    Printer,
    Package,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable manually if needed or just use any
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

interface EquipmentDetail {
    id: string;
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    imei?: string;
    observacoes?: string;
    estado?: string;
    cliente: {
        id: string;
        nome: string;
        email: string;
        telefone: string;
    };
    ordensServico: Array<{
        id: string;
        numeroOs: string;
        status: string;
        dataAbertura: string;
        dataConclusao?: string;
        defeitoRelatado: string;
        valorTotal: number;
        pecas: Array<{
            id: string;
            nome: string;
            quantidade: number;
            precoUnitario: number;
            precoTotal: number;
        }>;
    }>;
}

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const { id } = React.use(params);

    useEffect(() => {
        if (id) {
            fetchEquipment(id);
        }
    }, [id]);

    const fetchEquipment = async (eqId: string) => {
        try {
            const res = await fetch(`/api/equipamentos/${eqId}`);
            if (res.ok) {
                const data = await res.json();
                setEquipment(data);
            }
        } catch (error) {
            console.error("Error fetching detail", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            aberta: 'bg-blue-100 text-blue-700',
            em_andamento: 'bg-amber-100 text-amber-700',
            concluida: 'bg-green-100 text-green-700',
            cancelada: 'bg-red-100 text-red-700',
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    // Calculate warranty expiration
    const checkWarranty = (completionDate?: string) => {
        if (!completionDate) return { active: false, status: 'No Warranty' };

        const WARRANTY_DAYS = 90;
        const complete = new Date(completionDate);
        const expire = new Date(complete);
        expire.setDate(complete.getDate() + WARRANTY_DAYS);

        const now = new Date();
        const daysLeft = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const active = daysLeft > 0;

        return {
            active,
            expireDate: expire,
            daysLeft
        };
    };

    const generatePDF = () => {
        if (!equipment) return;

        const doc = new jsPDF() as any;

        // Header
        doc.setFontSize(20);
        doc.text('Relatório de Histórico do Equipamento', 14, 22);

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 30);

        // Equipment Info
        doc.setFontSize(12);
        doc.text('Detalhes do Equipamento:', 14, 40);

        doc.setFontSize(10);
        doc.text(`Dispositivo: ${equipment.tipo} ${equipment.modelo}`, 14, 48);
        doc.text(`Serial Number: ${equipment.numeroSerie}`, 14, 53);
        doc.text(`Cliente: ${equipment.cliente.nome}`, 14, 58);
        doc.text(`Marca: ${equipment.marca || '-'}`, 14, 63);

        let currentY = 75;

        // Service History Table
        doc.setFontSize(12);
        doc.text('Histórico de Serviços:', 14, currentY);
        currentY += 5;

        const tableBody = equipment.ordensServico.map(os => {
            const partsText = os.pecas.length > 0
                ? os.pecas.map(p => `${p.quantidade}x ${p.nome}`).join(', ')
                : 'Nenhuma peça';

            // Warranty Check in PDF
            const warranty = checkWarranty(os.dataConclusao);
            const warrantyText = os.status === 'concluida'
                ? (warranty.active ? `Garantia até ${warranty.expireDate.toLocaleDateString()}` : 'Garantia Expirada')
                : '-';

            return [
                os.numeroOs,
                new Date(os.dataAbertura).toLocaleDateString(),
                os.status,
                os.defeitoRelatado,
                partsText,
                warrantyText,
                `R$ ${Number(os.valorTotal).toFixed(2)}`
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['OS', 'Data', 'Status', 'Defeito', 'Peças', 'Garantia', 'Total']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 20 },
                3: { cellWidth: 35 },
                4: { cellWidth: 40 }, // Parts
                5: { cellWidth: 25 }, // Warranty
                6: { cellWidth: 20, halign: 'right' }
            },
            didParseCell: function (data: any) {
                // Add red color to Expired
                if (data.column.index === 5 && data.cell.text[0] === 'Garantia Expirada') {
                    data.cell.styles.textColor = [200, 0, 0];
                }
                if (data.column.index === 5 && data.cell.text[0].startsWith('Garantia até')) {
                    data.cell.styles.textColor = [0, 150, 0];
                }
            }
        });

        doc.save(`historico_equipamento_${equipment.numeroSerie}.pdf`);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
    if (!equipment) return <div className="p-8 text-center text-gray-500">Equipamento não encontrado.</div>;

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/equipamentos">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                        {equipment.tipo} {equipment.modelo}
                    </h1>
                    <Badge variant="outline" className="text-sm font-mono">
                        SN: {equipment.numeroSerie}
                    </Badge>
                </div>

                <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Histórico
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Card */}
                <Card className="md:col-span-1 border-l-4 border-l-blue-600 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Cliente Proprietário</label>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <Link href={`/dashboard/clientes/${equipment.cliente.id}`} className="text-blue-600 hover:underline">
                                    {equipment.cliente.nome}
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Marca</label>
                                <p className="font-medium">{equipment.marca || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Tipo</label>
                                <p className="font-medium">{equipment.tipo}</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">IMEI</label>
                            <p className="font-mono bg-gray-50 p-1 rounded">{equipment.imei || 'Não informado'}</p>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Estado Atual</label>
                            <p className="text-sm text-gray-700 mt-1">{equipment.estado || 'Sem danos registrados'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* History Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger
                                value="history"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none px-0 py-3 bg-transparent"
                            >
                                <History className="h-4 w-4 mr-2" /> Histórico de Serviços
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="pt-6">
                            <div className="space-y-4">
                                {equipment.ordensServico.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
                                        <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        Nenhum serviço realizado neste equipamento ainda.
                                    </div>
                                ) : (
                                    equipment.ordensServico.map(os => {
                                        const warranty = checkWarranty(os.dataConclusao);
                                        return (
                                            <div key={os.id} className="flex flex-col border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/dashboard/ordens-servico/${os.id}`} className="font-bold text-lg hover:underline text-blue-700">
                                                            {os.numeroOs}
                                                        </Link>
                                                        {getStatusBadge(os.status)}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(os.dataAbertura).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-700 ml-1 border-l-2 border-gray-200 pl-3">
                                                        {os.defeitoRelatado}
                                                    </p>
                                                </div>

                                                {/* Warranty Alert */}
                                                {os.status === 'concluida' && (
                                                    <div className={`mb-3 flex items-center gap-2 text-sm p-2 rounded ${warranty.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        {warranty.active ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                                        <span className="font-medium">
                                                            {warranty.active
                                                                ? `Garantia válida até ${warranty.expireDate.toLocaleDateString()} (${warranty.daysLeft} dias restantes)`
                                                                : `Garantia expirou em ${warranty.expireDate.toLocaleDateString()}`
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Parts Section */}
                                                {os.pecas.length > 0 && (
                                                    <div className="mb-3 bg-gray-50 p-3 rounded-md text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600 mb-2 font-medium">
                                                            <Package className="h-3 w-3" /> Peças Utilizadas:
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {os.pecas.map(peca => (
                                                                <li key={peca.id} className="flex justify-between text-gray-700">
                                                                    <span>{peca.quantidade}x {peca.nome}</span>
                                                                    <span className="text-gray-500">R$ {Number(peca.precoTotal).toFixed(2)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-2 border-t border-gray-100">
                                                    <span>Concluído: {os.dataConclusao ? new Date(os.dataConclusao).toLocaleDateString() : 'Em andamento'}</span>
                                                    <span className="font-semibold text-gray-900">Total: R$ {Number(os.valorTotal).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
