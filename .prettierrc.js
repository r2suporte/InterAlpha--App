module.exports = {
  // Configurações básicas
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // Configurações específicas para diferentes tipos de arquivo
  overrides: [
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'avoid',
        endOfLine: 'lf',
      },
    },
    {
      files: '*.{json,jsonc}',
      options: {
        semi: false,
        singleQuote: false,
        trailingComma: 'none',
        printWidth: 120,
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        semi: true,
        singleQuote: true,
        printWidth: 120,
      },
    },
    {
      files: '*.{md,mdx}',
      options: {
        semi: false,
        singleQuote: false,
        trailingComma: 'none',
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        semi: false,
        singleQuote: true,
        trailingComma: 'none',
        printWidth: 120,
      },
    },
  ],

  // Plugins
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],

  // Configurações do plugin de imports
  importOrder: [
    '^react$',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // Configurações do Tailwind CSS
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
};
