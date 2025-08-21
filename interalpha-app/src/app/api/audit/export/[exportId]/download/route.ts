import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Download de exportação
export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const { exportId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const exportData = await auditService.getExportData(exportId, currentUserId)

    if (!exportData) {
      return NextResponse.json(
        { error: 'Exportação não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    if (exportData.status !== 'completed') {
      return NextResponse.json(
        { error: `Exportação ainda não está pronta. Status: ${exportData.status}` },
        { status: 400 }
      )
    }

    // Definir headers para download
    const headers = new Headers()
    headers.set('Content-Type', exportData.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${exportData.filename}"`)
    
    if (exportData.fileSize) {
      headers.set('Content-Length', exportData.fileSize.toString())
    }

    // Retornar o arquivo
    const fileStream = await auditService.getExportFileStream(exportId)
    
    return new NextResponse(fileStream, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error downloading export:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}