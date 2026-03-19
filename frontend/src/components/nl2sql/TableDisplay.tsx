interface TableDisplayProps {
  colNames: string[];
  rows: any[][];
}

export const TableDisplay = ({ colNames, rows }: TableDisplayProps) => (
  <div className="overflow-auto max-h-[400px] border border-border rounded-lg">
    <table className="w-full text-sm">
      <thead className="bg-accent sticky top-0">
        <tr>
          {colNames.map((col, i) => (
            <th key={i} className="text-left px-3 py-2 font-medium text-foreground border-b border-border whitespace-nowrap font-mono text-xs">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="hover:bg-accent/50 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-3 py-1.5 border-b border-border/50 text-foreground font-mono text-xs whitespace-nowrap">
                {cell === null ? <span className="text-muted-foreground italic">null</span> : String(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
