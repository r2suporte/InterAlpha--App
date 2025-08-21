import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">IA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema InterAlpha
          </h1>
          <p className="text-gray-600">
            Criar conta de funcionário
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'text-xl font-semibold text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50',
                formFieldInput: 'border-gray-200 focus:border-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700'
              }
            }}
          />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Já tem uma conta?{' '}
            <a href="/sign-in" className="text-blue-600 hover:underline">
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}