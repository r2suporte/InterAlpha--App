// Configurações para todas as integrações

export const integrationConfig = {
  // Email (Nodemailer)
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@interalpha.com',
  },

  // Twilio (SMS e WhatsApp)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
  },

  // Google Calendar
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  },

  // Sistema Contábil
  accounting: {
    apiUrl: process.env.ACCOUNTING_API_URL,
    apiKey: process.env.ACCOUNTING_API_KEY,
  },

  // Redis/Queue
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },

  // Backup
  backup: {
    storagePath: process.env.BACKUP_STORAGE_PATH || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  },
};

// Validação de configurações obrigatórias
export function validateConfig() {
  const required = [
    'SMTP_USER',
    'SMTP_PASS',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Configurações faltando para integrações: ${missing.join(', ')}`);
    console.warn('Algumas funcionalidades podem não funcionar corretamente.');
  }

  return missing.length === 0;
}