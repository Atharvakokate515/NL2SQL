import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ChartSuggestion } from "@/types";

interface ChartDisplayProps {
  chart: ChartSuggestion;
  colNames: string[];
  rows: any[][];
}

const COLORS = [
  "hsl(239, 84%, 67%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)", "hsl(199, 89%, 48%)", "hsl(280, 65%, 60%)",
];

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chart, colNames, rows }) => {
  const xIdx = colNames.indexOf(chart.x_axis);
  const yIdx = colNames.indexOf(chart.y_axis);

  const data = rows.map((row) => {
    const obj: any = {};
    colNames.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });

  const commonProps = { data, margin: { top: 10, right: 20, left: 10, bottom: 10 } };

  if (chart.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 16%, 19.6%)" />
          <XAxis dataKey={chart.x_axis} tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }} />
          <YAxis tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "hsl(226, 20%, 12.7%)", border: "1px solid hsl(228, 16%, 19.6%)", borderRadius: 8, color: "hsl(210, 40%, 96%)" }} />
          <Bar dataKey={chart.y_axis} fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 16%, 19.6%)" />
          <XAxis dataKey={chart.x_axis} tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }} />
          <YAxis tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "hsl(226, 20%, 12.7%)", border: "1px solid hsl(228, 16%, 19.6%)", borderRadius: 8, color: "hsl(210, 40%, 96%)" }} />
          <Line type="monotone" dataKey={chart.y_axis} stroke="hsl(239, 84%, 67%)" strokeWidth={2} dot={{ fill: "hsl(239, 84%, 67%)" }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey={colNames[1]} nameKey={colNames[0]} cx="50%" cy="50%" outerRadius={100} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "hsl(226, 20%, 12.7%)", border: "1px solid hsl(228, 16%, 19.6%)", borderRadius: 8, color: "hsl(210, 40%, 96%)" }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default ChartDisplay;
