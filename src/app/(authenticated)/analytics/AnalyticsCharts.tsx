"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

interface ChartData {
  date: string;
  focusMinutes: number;
  score: number;
}

export function AnalyticsCharts({ data }: { data: ChartData[] }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Focus Time (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'var(--color-secondary)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
              <Bar dataKey="focusMinutes" fill="#B8A9C9" radius={[4, 4, 0, 0]} name="Focus (min)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Focus Score Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#A7C4D4" 
                strokeWidth={2}
                dot={{ r: 4, fill: "#A7C4D4" }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
