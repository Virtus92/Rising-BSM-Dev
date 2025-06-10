'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from 'recharts';
import { ApiKeyUsageStatsDto } from '@/domain/dtos/ApiKeyDtos';

interface ApiKeyStatsProps {
  stats: ApiKeyUsageStatsDto | null;
}

export function ApiKeyStats({ stats }: ApiKeyStatsProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    );
  }

  // Calculate percentages
  const activePercentage = stats.totalKeys > 0 ? (stats.activeKeys / stats.totalKeys) * 100 : 0;
  const adminPercentage = stats.totalKeys > 0 ? (stats.adminKeys / stats.totalKeys) * 100 : 0;

  // Data for pie chart
  const statusData = [
    { name: 'Active', value: stats.activeKeys, color: '#10b981' },
    { name: 'Inactive', value: stats.inactiveKeys, color: '#6b7280' },
    { name: 'Revoked', value: stats.revokedKeys, color: '#ef4444' },
    { name: 'Expired', value: stats.expiredKeys, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const typeData = [
    { name: 'Admin Keys', value: stats.adminKeys, color: '#8b5cf6' },
    { name: 'Standard Keys', value: stats.standardKeys, color: '#06b6d4' }
  ].filter(item => item.value > 0);

  // Usage data for bar chart
  const usageData = stats.recentlyUsed.slice(0, 10).map(key => ({
    name: key.name.substring(0, 15) + (key.name.length > 15 ? '...' : ''),
    usage: key.usageCount
  }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKeys}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-xs font-medium">{activePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={activePercentage} className="mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminKeys}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Of total</span>
              <span className="text-xs font-medium">{adminPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={adminPercentage} className="mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              API calls across all keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalKeys > 0 ? Math.round((stats.activeKeys / stats.totalKeys) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on active vs total keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Key Status Distribution</CardTitle>
            <CardDescription>Breakdown of API key statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Key Type Distribution</CardTitle>
            <CardDescription>Admin vs Standard keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {typeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      {usageData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Used Keys</CardTitle>
            <CardDescription>API call usage by key</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.expiringSoonKeys > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-orange-800">Keys Expiring Soon</p>
                    <p className="text-sm text-orange-600">
                      {stats.expiringSoonKeys} key(s) expire within 7 days
                    </p>
                  </div>
                  <Badge variant="warning">{stats.expiringSoonKeys}</Badge>
                </div>
              )}
              
              {stats.expiredKeys > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Expired Keys</p>
                    <p className="text-sm text-red-600">
                      {stats.expiredKeys} key(s) have expired
                    </p>
                  </div>
                  <Badge variant="destructive">{stats.expiredKeys}</Badge>
                </div>
              )}

              {stats.unusedKeys.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Unused Keys</p>
                    <p className="text-sm text-gray-600">
                      {stats.unusedKeys.length} key(s) haven't been used recently
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.unusedKeys.length}</Badge>
                </div>
              )}

              {stats.expiringSoonKeys === 0 && stats.expiredKeys === 0 && stats.unusedKeys.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No security alerts at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.unusedKeys.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Review Unused Keys</p>
                  <p className="text-sm text-blue-600">
                    Consider revoking keys that haven't been used in 30+ days
                  </p>
                </div>
              )}

              {stats.adminKeys > stats.standardKeys && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Reduce Admin Keys</p>
                  <p className="text-sm text-yellow-600">
                    Consider using standard keys with specific permissions instead
                  </p>
                </div>
              )}

              {stats.totalUsage > 10000 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">High Usage Detected</p>
                  <p className="text-sm text-green-600">
                    Monitor API usage and consider implementing rate limiting
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
