'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Printer, FileDown, Eye } from 'lucide-react'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'
import { ImpressaoOSEntrada } from './ImpressaoOSEntrada'
import { ImpressaoOSSaida } from './ImpressaoOSSaida'

interface ImpressaoOSProps {
  ordem: OrdemServicoApple
  tipo: 'entrada' | 'saida'
}

export function ImpressaoOS({ ordem, tipo }: ImpressaoOSProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `OS-${ordem.numero}-${tipo}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .print\\:hidden {
          display: none !important;
        }
        .print\\:p-4 {
          padding: 1rem !important;
        }
        .print\\:max-w-none {
          max-width: none !important;
        }
      }
    `
  })

  const titulo = tipo === 'entrada' ? 'O.S de Entrada' : 'O.S de Saída'
  const icone = tipo === 'entrada' ? FileDown : Eye

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {icone === FileDown ? <FileDown className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {titulo}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{titulo} - {ordem.numero}</span>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {tipo === 'entrada' ? (
            <ImpressaoOSEntrada ref={componentRef} ordem={ordem} />
          ) : (
            <ImpressaoOSSaida ref={componentRef} ordem={ordem} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}