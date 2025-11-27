'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    target?: number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    sparklineData?: number[];
    description?: string;
    status?: 'success' | 'warning' | 'danger' | 'neutral';
    unit?: string;
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    target,
    icon,
    trend = 'neutral',
    sparklineData,
    description,
    status = 'neutral',
    unit,
    className = '',
}) => {
    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600 dark:text-green-400';
        if (trend === 'down') return 'text-red-600 dark:text-red-400';
        return 'text-muted-foreground';
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20';
            case 'warning':
                return 'border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20';
            case 'danger':
                return 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20';
            default:
                return '';
        }
    };

    const progressValue = target ? Math.min((Number(value) / target) * 100, 100) : 0;
    const progressColor = progressValue >= 100 ? 'bg-green-500' : progressValue >= 75 ? 'bg-blue-500' : progressValue >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        className={`
              transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer
              ${getStatusColor()} ${className}
            `}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {title}
                            </CardTitle>
                            <div className="h-4 w-4 text-muted-foreground">{icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Main Value */}
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold tracking-tight">
                                        {value}
                                    </div>
                                    {unit && (
                                        <span className="text-sm text-muted-foreground">{unit}</span>
                                    )}
                                </div>

                                {/* Trend Indicator */}
                                {change !== undefined && (
                                    <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                                        {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                                        {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                                        {trend === 'neutral' && <Minus className="h-4 w-4" />}
                                        <span>{change > 0 ? '+' : ''}{change}%</span>
                                        <span className="text-xs text-muted-foreground font-normal">
                                            vs período anterior
                                        </span>
                                    </div>
                                )}

                                {/* Progress Bar for Target */}
                                {target && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Meta: {target}</span>
                                            <span>{progressValue.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                )}

                                {/* Sparkline */}
                                {sparklineData && sparklineData.length > 0 && (
                                    <div className="h-12 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={sparklineData.map((value, index) => ({ value, index }))}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Status Badge */}
                                {status !== 'neutral' && (
                                    <Badge
                                        variant={
                                            status === 'success'
                                                ? 'default'
                                                : status === 'warning'
                                                    ? 'secondary'
                                                    : 'destructive'
                                        }
                                        className="text-xs"
                                    >
                                        {status === 'success' && 'Excelente'}
                                        {status === 'warning' && 'Atenção'}
                                        {status === 'danger' && 'Crítico'}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                {description && (
                    <TooltipContent>
                        <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
};
