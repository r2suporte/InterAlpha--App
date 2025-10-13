import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔍 Security Audit Middleware - InterAlpha App
 *
 * Monitora e registra atividades suspeitas de segurança
 * Implementa logging de auditoria e detecção de ameaças
 */

interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  userId?: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

type SecurityEventType =
  | 'failed_login'
  | 'suspicious_request'
  | 'rate_limit_exceeded'
  | 'invalid_token'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'unauthorized_access'
  | 'privilege_escalation'
  | 'data_breach_attempt';

// Cache em memória para eventos de segurança (em produção, usar banco de dados)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 10000; // Máximo de eventos em memória

/**
 * Obtém informações do cliente da requisição
 */
function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  const ip =
    cfConnectingIP || realIP || forwarded?.split(',')[0].trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}

/**
 * Registra um evento de segurança
 */
export function logSecurityEvent(
  request: NextRequest,
  eventType: SecurityEventType,
  severity: SecurityEvent['severity'],
  details: Record<string, any> = {},
  userId?: string
) {
  const { ip, userAgent } = getClientInfo(request);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    userId,
    eventType,
    severity,
    details,
  };

  // Adicionar ao cache (remover eventos antigos se necessário)
  securityEvents.push(event);
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift(); // Remove o mais antigo
  }

  // Log no console para desenvolvimento
  const logLevel =
    severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
  console[logLevel](`[SECURITY] ${eventType.toUpperCase()}:`, {
    ip,
    endpoint: request.nextUrl.pathname,
    severity,
    details,
  });

  // Em produção, enviar para sistema de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar com sistema de alertas (Slack, email, etc.)
    if (severity === 'critical' || severity === 'high') {
      sendSecurityAlert(event);
    }
  }
}

/**
 * Detecta tentativas de SQL Injection
 */
function detectSQLInjection(request: NextRequest): boolean {
  const url = request.nextUrl.toString();
  const body = request.body?.toString() || '';

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /('|\"|;|--|\*|\/\*|\*\/)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)/i,
  ];

  const testString = url + body;
  return sqlPatterns.some(pattern => pattern.test(testString));
}

/**
 * Detecta tentativas de XSS
 */
function detectXSS(request: NextRequest): boolean {
  const url = request.nextUrl.toString();
  const body = request.body?.toString() || '';

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  const testString = url + body;
  return xssPatterns.some(pattern => pattern.test(testString));
}

/**
 * Detecta User-Agents suspeitos
 */
function detectSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|java|go-http/i,
    /sqlmap|nikto|nmap|masscan/i,
    /^$/, // User-Agent vazio
    /.{200,}/, // User-Agent muito longo
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Detecta tentativas de acesso a arquivos sensíveis
 */
function detectSensitiveFileAccess(pathname: string): boolean {
  const sensitivePatterns = [
    /\.(env|config|ini|conf|log|bak|backup|sql|db)$/i,
    /\/(\.git|\.svn|\.hg|node_modules|\.env)/i,
    /\/(admin|administrator|root|config|backup)/i,
    /\.(php|asp|jsp|cgi)$/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(pathname));
}

/**
 * Middleware principal de auditoria de segurança
 */
export function securityAuditMiddleware(
  request: NextRequest
): NextResponse | null {
  const { ip, userAgent } = getClientInfo(request);
  const {pathname} = request.nextUrl;

  // Detectar tentativas de SQL Injection
  if (detectSQLInjection(request)) {
    logSecurityEvent(request, 'sql_injection_attempt', 'high', {
      url: request.nextUrl.toString(),
      suspiciousContent: 'SQL injection patterns detected',
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Request blocked',
        message: 'Requisição suspeita detectada',
        code: 'SECURITY_VIOLATION',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Detectar tentativas de XSS
  if (detectXSS(request)) {
    logSecurityEvent(request, 'xss_attempt', 'high', {
      url: request.nextUrl.toString(),
      suspiciousContent: 'XSS patterns detected',
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Request blocked',
        message: 'Requisição suspeita detectada',
        code: 'SECURITY_VIOLATION',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Detectar User-Agents suspeitos
  if (detectSuspiciousUserAgent(userAgent)) {
    logSecurityEvent(request, 'suspicious_request', 'medium', {
      userAgent,
      reason: 'Suspicious user agent detected',
    });
  }

  // Detectar acesso a arquivos sensíveis
  if (detectSensitiveFileAccess(pathname)) {
    logSecurityEvent(request, 'unauthorized_access', 'high', {
      pathname,
      reason: 'Attempt to access sensitive file',
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        message: 'Acesso negado',
        code: 'FORBIDDEN',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null; // Permite a requisição
}

/**
 * Envia alerta de segurança crítico
 */
async function sendSecurityAlert(event: SecurityEvent) {
  // TODO: Implementar integração com sistema de alertas
  console.error('[CRITICAL SECURITY ALERT]', event);

  // Exemplo de integração com webhook/Slack
  if (process.env.SECURITY_WEBHOOK_URL) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ALERTA DE SEGURANÇA CRÍTICO`,
          attachments: [
            {
              color: 'danger',
              fields: [
                { title: 'Tipo', value: event.eventType, short: true },
                { title: 'Severidade', value: event.severity, short: true },
                { title: 'IP', value: event.ip, short: true },
                { title: 'Endpoint', value: event.endpoint, short: true },
                { title: 'Timestamp', value: event.timestamp, short: false },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Erro ao enviar alerta de segurança:', error);
    }
  }
}

/**
 * Obtém eventos de segurança recentes
 */
export function getRecentSecurityEvents(limit: number = 100): SecurityEvent[] {
  return securityEvents
    .slice(-limit)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

/**
 * Obtém estatísticas de segurança
 */
export function getSecurityStats() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  const events24h = securityEvents.filter(e => new Date(e.timestamp) > last24h);
  const eventsHour = securityEvents.filter(
    e => new Date(e.timestamp) > lastHour
  );

  const eventsByType = securityEvents.reduce(
    (acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const eventsBySeverity = securityEvents.reduce(
    (acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalEvents: securityEvents.length,
    events24h: events24h.length,
    eventsLastHour: eventsHour.length,
    eventsByType,
    eventsBySeverity,
    topIPs: getTopIPs(10),
    criticalEvents: securityEvents.filter(e => e.severity === 'critical')
      .length,
  };
}

/**
 * Obtém IPs com mais eventos suspeitos
 */
function getTopIPs(limit: number = 10) {
  const ipCounts = securityEvents.reduce(
    (acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([ip, count]) => ({ ip, count }));
}

/**
 * Limpa eventos antigos (para manutenção)
 */
export function cleanupOldEvents(daysToKeep: number = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const initialLength = securityEvents.length;
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    if (new Date(securityEvents[i].timestamp) < cutoffDate) {
      securityEvents.splice(i, 1);
    }
  }

  const removedCount = initialLength - securityEvents.length;
  console.log(`Limpeza de eventos: ${removedCount} eventos antigos removidos`);

  return removedCount;
}
