import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Shield, Zap, Users, Sparkles, CheckCircle, Star, Building, Key } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  // Esta página é para usuários não autenticados
  // Funcionários autenticados são redirecionados para /dashboard pelo middleware
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                InterAlpha
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/client/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <Key className="h-4 w-4 mr-2" />
                  Portal do Cliente
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="text-gray-700 hover:bg-gray-50">
                  <Building className="h-4 w-4 mr-2" />
                  Funcionários
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-2xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 mb-8">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Novo: Dashboard com IA integrada</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Sistema InterAlpha
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Acesso Restrito
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Sistema privado de gestão empresarial para{' '}
              <span className="font-semibold text-gray-800">funcionários autorizados</span> e{' '}
              <span className="font-semibold text-gray-800">clientes com chave de acesso</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/sign-in">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl px-8 py-4 text-lg font-semibold border-0 group">
                  <Building className="mr-2 h-5 w-5" />
                  Acesso de Funcionários
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/client/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold">
                  <Key className="mr-2 h-5 w-5" />
                  Portal do Cliente
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600 mb-20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">30 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Segurança bancária</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Setup em 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Tudo que você precisa
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Recursos poderosos projetados para escalar com seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold mb-4 text-gray-900">Segurança Avançada</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Criptografia de nível bancário, backup automático e conformidade com LGPD para máxima proteção dos seus dados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold mb-4 text-gray-900">Performance Otimizada</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Interface ultra-rápida com IA integrada que automatiza tarefas repetitivas e acelera sua produtividade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold mb-4 text-gray-900">Suporte Premium</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Equipe especializada disponível 24/7 com onboarding personalizado e treinamento completo da plataforma
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative container mx-auto px-4 py-20">
          <div className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-3xl"></div>
            
            <Card className="relative max-w-4xl mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center p-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 mb-6 mx-auto">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Mais de 10.000 empresas confiam</span>
                </div>
                
                <CardTitle className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Transforme sua gestão
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    hoje mesmo
                  </span>
                </CardTitle>
                
                <CardDescription className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Junte-se às empresas que já descobriram como crescer mais rápido com a plataforma de gestão mais completa do mercado
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-12 pb-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link href="/sign-up">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl px-8 py-4 text-lg font-semibold border-0 group">
                      <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      Começar Agora - É Grátis
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/contato">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold">
                      Falar com Especialista
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Sem cartão de crédito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cancelamento gratuito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Suporte incluído</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                InterAlpha
              </span>
            </div>
            
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              A plataforma de gestão empresarial que cresce com seu negócio
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400 mb-8">
              <Link href="/privacidade" className="hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link href="/contato" className="hover:text-white transition-colors">
                Contato
              </Link>
              <Link href="/suporte" className="hover:text-white transition-colors">
                Suporte
              </Link>
            </div>
            
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500 text-sm">
                © 2024 InterAlpha. Todos os direitos reservados. Feito com ❤️ no Brasil.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}