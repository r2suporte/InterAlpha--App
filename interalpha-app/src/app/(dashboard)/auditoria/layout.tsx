import { AuditNavigation } from '@/components/audit/audit-navigation'

export default function AuditoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col space-y-6">
      <AuditNavigation />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}