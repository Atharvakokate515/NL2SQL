import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartSuggestion } from "@/types";

interface ChartDisplayProps {
  chart: ChartSuggestion;
  colNames: string[];
  rows: any[][];
}

const COLORS = [
  "hsl(220, 40%, 54%)", "hsl(210, 50%, 68%)", "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(260, 50%, 60%)"
];

export const ChartDisplay = ({ chart, colNames, rows }: ChartDisplayProps) => {
  const xIdx = colNames.indexOf(chart.x_axis);
  const yIdx = colNames.indexOf(chart.y_axis);
  if (xIdx === -1 || yIdx === -1) return <p className="text-muted-foreground text-sm p-4">Cannot render chart.</p>;

  const data = rows.map(r => ({
    name: String(r[xIdx]),
    value: Number(r[yIdx]) || 0,
  }));

  const common = { width: "100%", height: 300 } as const;

  if (chart.type === "bar") {
    return (
      <ResponsiveContainer {...common}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 27%, 26%)" />
          <XAxis dataKey="name" stroke="hsl(215, 18%, 47%)" fontSize={11} />
          <YAxis stroke="hsl(215, 18%, 47%)" fontSize={11} />
          <Tooltip contentStyle={{ background: "hsl(224, 30%, 19%)", border: "1px solid hsl(225, 27%, 26%)", borderRadius: 8, color: "hsl(222, 50%, 93%)" }} />
          <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "line") {
    return (
      <ResponsiveContainer {...common}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 27%, 26%)" />
          <XAxis dataKey="name" stroke="hsl(215, 18%, 47%)" fontSize={11} />
          <YAxis stroke="hsl(215, 18%, 47%)" fontSize={11} />
          <Tooltip contentStyle={{ background: "hsl(224, 30%, 19%)", border: "1px solid hsl(225, 27%, 26%)", borderRadius: 8, color: "hsl(222, 50%, 93%)" }} />
          <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[1] }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer {...common}>
        <PieChart>
          <Tooltip contentStyle={{ background: "hsl(224, 30%, 19%)", border: "1px solid hsl(225, 27%, 26%)", borderRadius: 8, color: "hsl(222, 50%, 93%)" }} />
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
};
