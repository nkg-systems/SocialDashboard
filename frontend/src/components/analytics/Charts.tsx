'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { Card } from '../ui/Card';

// Secure color palette following SM3D design
const CHART_COLORS = {
  primary: '#E50914',
  secondary: '#666666',
  accent: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  platforms: {
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    tiktok: '#FE2C55',
    youtube: '#FF0000'
  }
} as const;

// Data validation and sanitization
const validateChartData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  return data.every(item => 
    item && typeof item === 'object' && 
    Object.values(item).every(value => 
      typeof value === 'string' || typeof value === 'number'
    )
  );
};

const sanitizeChartData = (data: any[]): any[] => {
  if (!validateChartData(data)) return [];
  
  return data.map(item => {
    const sanitized: any = {};
    Object.entries(item).forEach(([key, value]) => {
      // Sanitize key names
      const safeKey = key.replace(/[<>]/g, '').substring(0, 50);
      
      // Sanitize values
      if (typeof value === 'string') {
        sanitized[safeKey] = value.replace(/[<>]/g, '').substring(0, 100);
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[safeKey] = value;
      }
    });
    return sanitized;
  });
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-surface border border-border rounded-button p-3 shadow-card">
      {label && (
        <p className="text-text-primary font-medium mb-2">
          {typeof label === 'string' && label.includes('T') 
            ? format(parseISO(label), 'MMM dd, yyyy')
            : label}
        </p>
      )}
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          <span className="font-medium">{entry.name}:</span>{' '}
          {formatter ? formatter(entry.value, entry.name) : entry.value}
        </p>
      ))}
    </div>
  );
};

// Line Chart Component
interface LineChartProps {
  data: any[];
  xKey: string;
  yKeys: string[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
  formatter?: (value: any, name: string) => string;
}

export const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKeys,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.accent],
  formatter
}) => {
  const sanitizedData = useMemo(() => sanitizeChartData(data), [data]);

  if (sanitizedData.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted">No data available</p>
      </Card>
    );
  }

  return (
    <Card>
      {title && <h3 className="sm3d-text-h2 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={sanitizedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.secondary} opacity={0.3} />}
          <XAxis 
            dataKey={xKey}
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes('T')) {
                const date = parseISO(value);
                return isValid(date) ? format(date, 'MMM dd') : value;
              }
              return value;
            }}
          />
          <YAxis 
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
          />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Area Chart Component
interface AreaChartProps extends LineChartProps {
  fillOpacity?: number;
}

export const AreaChartComponent: React.FC<AreaChartProps> = ({
  data,
  xKey,
  yKeys,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.accent],
  formatter,
  fillOpacity = 0.3
}) => {
  const sanitizedData = useMemo(() => sanitizeChartData(data), [data]);

  if (sanitizedData.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted">No data available</p>
      </Card>
    );
  }

  return (
    <Card>
      {title && <h3 className="sm3d-text-h2 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={sanitizedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.secondary} opacity={0.3} />}
          <XAxis 
            dataKey={xKey}
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
          />
          <YAxis 
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
          />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={fillOpacity}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Bar Chart Component
interface BarChartProps extends LineChartProps {
  horizontal?: boolean;
}

export const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKeys,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.accent],
  formatter,
  horizontal = false
}) => {
  const sanitizedData = useMemo(() => sanitizeChartData(data), [data]);

  if (sanitizedData.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted">No data available</p>
      </Card>
    );
  }

  return (
    <Card>
      {title && <h3 className="sm3d-text-h2 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={sanitizedData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.secondary} opacity={0.3} />}
          <XAxis 
            dataKey={horizontal ? undefined : xKey}
            type={horizontal ? 'number' : 'category'}
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
          />
          <YAxis 
            dataKey={horizontal ? xKey : undefined}
            type={horizontal ? 'category' : 'number'}
            stroke={CHART_COLORS.secondary}
            tick={{ fontSize: 12, fill: CHART_COLORS.secondary }}
          />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Pie Chart Component
interface PieChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
  colors?: string[];
  formatter?: (value: any, name: string) => string;
}

export const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  colors = Object.values(CHART_COLORS.platforms),
  formatter
}) => {
  const sanitizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => 
      item && 
      typeof item.name === 'string' && 
      typeof item.value === 'number' && 
      isFinite(item.value) &&
      item.value >= 0
    ).map(item => ({
      ...item,
      name: item.name.replace(/[<>]/g, '').substring(0, 50)
    }));
  }, [data]);

  if (sanitizedData.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted">No data available</p>
      </Card>
    );
  }

  return (
    <Card>
      {title && <h3 className="sm3d-text-h2 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={sanitizedData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {sanitizedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Metric Card with Trend Indicator
interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  change,
  changeLabel,
  color = 'default',
  icon,
  loading = false
}) => {
  const colorClasses = {
    default: 'text-text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info'
  };

  const trendColor = change ? (change >= 0 ? 'text-success' : 'text-error') : 'text-text-muted';
  const trendIcon = change ? (change >= 0 ? '↗️' : '↘️') : '';

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-border rounded w-24 mb-3"></div>
            <div className="h-8 bg-border rounded w-16 mb-2"></div>
            <div className="h-3 bg-border rounded w-32"></div>
          </div>
          <div className="w-10 h-10 bg-border rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
          <p className={`text-2xl font-bold mb-2 ${colorClasses[color]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {(change !== undefined || changeLabel) && (
            <p className={`text-sm ${trendColor} flex items-center gap-1`}>
              {trendIcon && <span>{trendIcon}</span>}
              {change !== undefined && (
                <span>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              )}
              {changeLabel && <span>{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-text-muted opacity-70">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};