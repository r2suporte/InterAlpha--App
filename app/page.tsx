import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header Section */}
      <div className="relative pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-blue-400 to-purple-600 opacity-20 mix-blend-multiply blur-xl filter"></div>
          <div className="absolute -bottom-40 -left-32 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-pink-400 to-red-600 opacity-20 mix-blend-multiply blur-xl filter delay-1000"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <h1 className="mb-6 animate-pulse bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-7xl font-bold text-transparent md:text-8xl">
            InterAlpha
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-light text-gray-600 dark:text-gray-300 md:text-2xl">
            Plataforma completa para gestão de serviços e relacionamento com
            clientes
          </p>
        </div>
      </div>

      {/* Portals Section */}
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid items-stretch gap-8 md:grid-cols-2 lg:gap-12">
          {/* Portal do Cliente */}
          <div className="group relative h-full">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-25 blur transition duration-1000 group-hover:opacity-75 group-hover:duration-200"></div>
            <div className="relative flex h-full transform flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl transition-all duration-300 hover:scale-105 dark:border-gray-700 dark:bg-gray-800 lg:p-10">
              <div className="mb-8 flex-grow text-center">
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="absolute inset-0 rotate-6 transform rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg">
                    <svg
                      className="h-10 w-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  Portal do Cliente
                </h2>
                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Acompanhe suas ordens de serviço, aprove orçamentos e gerencie
                  seus dados
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <Link
                  href="/portal/cliente/login"
                  className="block w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  Acessar Portal do Cliente
                </Link>
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  Use o login e senha enviados por email
                </div>
              </div>
            </div>
          </div>

          {/* Portal do Funcionário */}
          <div className="group relative h-full">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 opacity-25 blur transition duration-1000 group-hover:opacity-75 group-hover:duration-200"></div>
            <div className="relative flex h-full transform flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl transition-all duration-300 hover:scale-105 dark:border-gray-700 dark:bg-gray-800 lg:p-10">
              <div className="mb-8 flex-grow text-center">
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="absolute inset-0 rotate-6 transform rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600"></div>
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                    <svg
                      className="h-10 w-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  Portal do Funcionário
                </h2>
                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Gerencie ordens de serviço, clientes, equipamentos e
                  relatórios
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <Link
                  href="/auth/login"
                  className="block w-full transform rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl"
                >
                  Acessar Sistema
                </Link>
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  Acesso restrito a funcionários autorizados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
