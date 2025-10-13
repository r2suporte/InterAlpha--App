'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ButtonLoading } from '@/components/ui/loading';
import {
  LoadingSpinner,
  useLoadingState,
} from '@/components/ui/loading-states';
import { useToast } from '@/components/ui/toast-system';
import { createClient } from '@/lib/supabase/client';

// Função auxiliar para fallback via API interna
async function apiLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Falha na autenticação');
  }

  return res.json();
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const [error, setError] = useState('');
  const { success, error: showError } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    startLoading();
    setError('');

    try {
      let data: any = null;
      let error: any = null;

      // Tenta login via Supabase
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = result.data;
        error = result.error;
      } catch (e) {
        // Ignora e tenta fallback
      }

      // Fallback para API interna se Supabase não estiver disponível
      if (error || !data?.user) {
        const api = await apiLogin(email, password);
        data = {
          user: { id: api.user.id, email: api.user.email, role: api.user.role },
          session: {
            access_token: api.session.access_token,
            refresh_token: api.session.refresh_token,
            expires_at: api.session.expires_at,
          },
        };
        error = null;
      }

      if (error) {
        const msg =
          error.message === 'Invalid login credentials' ||
          error.message?.toLowerCase().includes('credenciais')
            ? 'Email ou senha incorretos.'
            : error.message || 'Falha na autenticação.';
        setError(msg);
        showError('Erro no login', msg);
        return;
      }

      if (data.user) {
        // Verificar se o usuário existe na nossa tabela
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();
        // Se usuário não encontrado, criar registro básico
        if (!userData) {
          const { error: insertError } = await supabase.from('users').insert({
            email: data.user.email!,
            name: (data as any).user?.user_metadata?.name || data.user.email!.split('@')[0],
            role: 'user',
          });

          if (insertError) {
            console.error('Erro ao criar usuário:', insertError);
          }
        }

        // Toast de sucesso
        success('Login realizado com sucesso!', 'Redirecionando...');

        // Redirecionar baseado no role do usuário (preferir role da tabela, senão da API)
        const roleForRedirect = userData?.role || (data as any)?.user?.role;
        if (roleForRedirect === 'admin' || roleForRedirect === 'technician') {
          router.push('/dashboard');
        } else {
          router.push('/portal/cliente/dashboard');
        }
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      showError('Erro inesperado', 'Tente novamente em alguns instantes.');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Portal de acesso para funcionários
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <ButtonLoading />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
