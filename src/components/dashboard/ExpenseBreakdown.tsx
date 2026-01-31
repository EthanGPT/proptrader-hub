import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { mockExpenses } from "@/data/mockData";
import { EXPENSE_CATEGORIES } from "@/types";

export function ExpenseBreakdown() {
  // Calculate expense breakdown by category
  const categoryTotals = mockExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category,
    value: amount,
  }));

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Expense Breakdown</h3>
        <p className="text-sm text-muted-foreground">By category</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card rounded-lg p-3">
                        <p className="text-sm font-medium">{payload[0].name}</p>
                        <p className="text-lg font-bold">
                          ${payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold">${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
