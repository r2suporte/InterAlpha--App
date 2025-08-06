import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Shield, Zap, Users } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  // Temporariamente removido a verificação de usuário do Clerk
  // até que as chaves de API sejam configuradas

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IA</span>
            </div>
            <span className="text-xl font-bold text-gray-900">InterAlpha</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestão
            <span className="text-blue-600"> Completo</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Gerencie seus serviços, clientes e pagamentos em uma única plataforma.
            Solução completa para empresas que buscam eficiência e crescimento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/servicos">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver Serviços
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Seguro e Confiável</CardTitle>
              <CardDescription>
                Seus dados protegidos com criptografia de ponta e backup automático
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Rápido e Eficiente</CardTitle>
              <CardDescription>
                Interface intuitiva que acelera seus processos e aumenta a produtividade
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Suporte Dedicado</CardTitle>
              <CardDescription>
                Equipe especializada pronta para ajudar você a crescer seu negócio
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Pronto para começar?</CardTitle>
              <CardDescription className="text-lg">
                Junte-se a milhares de empresas que já transformaram sua gestão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <span className="text-xl font-bold">InterAlpha</span>
            </div>
            <p className="text-gray-400">
              © 2024 InterAlpha. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}