import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import PDFGenerator from '@/lib/services/pdf-generator';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const id = params.id;

        const ordem = await prisma.ordemServico.findUnique({
            where: { id },
            include: {
                cliente: true,
                pecas: true
            }
            // Note: If you have relations for 'equipamento' or others, include them. 
            // Based on previous analysis, we are using flat fields or 'equipamento' might be embedded.
            // The PDFGenerator expects 'equipamento' object in OrdemServico type. 
            // We might need to map it if it's flat fields in DB.
        });

        if (!ordem) {
            return NextResponse.json(
                { error: 'Ordem de serviço não encontrada' },
                { status: 404 }
            );
        }

        // Map to expected interface if necessary
        // The PDFGenerator expects 'equipamento' property. 
        // If DB has flat fields 'tipoDispositivo', 'modeloDispositivo', we map them to 'equipamento' object.
        const ordemParaPDF: any = {
            ...ordem,
            numero_os: ordem.numeroOs,
            tipo_servico: (ordem.tipoDispositivo as any) || 'reparo', // Mapping back
            created_at: ordem.createdAt.toISOString(),
            equipamento: {
                tipo: ordem.tipoDispositivo,
                modelo: ordem.modeloDispositivo,
                serial_number: ordem.numeroSerie,
                // Add others if available
            }
        };

        const generator = new PDFGenerator();
        const pdfBuffer = await generator.generateOrdemServicoPDF(ordemParaPDF);

        const filename = PDFGenerator.generateFileName(ordemParaPDF);

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        return NextResponse.json(
            { error: 'Erro interno ao gerar PDF' },
            { status: 500 }
        );
    }
}
