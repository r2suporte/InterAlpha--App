import { NextResponse } from 'next/server';
import { 
  getQueueStats,
  emailQueue,
  smsQueue,
  whatsappQueue,
  calendarQueue,
  accountingQueue,
  backupQueue,
  workflowQueue
} from '@/lib/integrations';

export async function GET() {
  try {
    const queues = [
      { name: 'email', queue: emailQueue },
      { name: 'sms', queue: smsQueue },
      { name: 'whatsapp', queue: whatsappQueue },
      { name: 'calendar', queue: calendarQueue },
      { name: 'accounting', queue: accountingQueue },
      { name: 'backup', queue: backupQueue },
      { name: 'workflow', queue: workflowQueue },
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => ({
        name,
        ...(await getQueueStats(queue)),
      }))
    );

    const totalStats = stats.reduce(
      (acc, stat) => ({
        waiting: acc.waiting + stat.waiting,
        active: acc.active + stat.active,
        completed: acc.completed + stat.completed,
        failed: acc.failed + stat.failed,
        delayed: acc.delayed + stat.delayed,
      }),
      { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: totalStats,
      queues: stats,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao obter estatísticas das filas',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}