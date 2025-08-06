export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">IA</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">InterAlpha</h1>
                <p className="text-sm text-gray-600">Sistema de Gestão</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; 2024 InterAlpha. Todos os direitos reservados.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-blue-600 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}