import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes externos para o servidor (funciona com Turbopack e Webpack)
  serverExternalPackages: ['bullmq', 'ioredis', 'handlebars'],
  
  eslint: {
    // Ignorar erros do ESLint durante o build
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Ignorar erros do TypeScript durante o build
    ignoreBuildErrors: true,
  },
  
  // Configuração específica para Webpack (usado apenas no build de produção)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('bullmq', 'ioredis', 'handlebars');
    }
    return config;
  },
  
  // Configuração do Turbopack (agora estável)
  turbopack: {
    rules: {
      // Configurações específicas do Turbopack podem ser adicionadas aqui
    },
  },
};

export default nextConfig;
