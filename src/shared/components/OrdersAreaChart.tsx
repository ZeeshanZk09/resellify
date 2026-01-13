"use client";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function OrdersAreaChart({
  allOrders,
}: {
  allOrders:
    | {
        totalAmount: number;
        createdAt: Date;
      }[]
    | undefined;
}) {
  const [view, setView] = useState<"day" | "week" | "month">("day");

  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = getISOWeek(d);
    return `${year}-W${week}`;
  };

  const getISOWeek = (date: Date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const getMonthKey = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const groupOrders = () => {
    if (!allOrders) return {};
    switch (view) {
      case "day": {
        return allOrders.reduce<Record<string, number>>((acc, order) => {
          const date = new Date(order.createdAt).toISOString().split("T")[0];
          acc[date] = (acc[date] ?? 0) + 1;
          return acc;
        }, {});
      }
      case "week": {
        return allOrders.reduce<Record<string, number>>((acc, order) => {
          const weekKey = getWeekKey(order.createdAt);
          acc[weekKey] = (acc[weekKey] ?? 0) + 1;
          return acc;
        }, {});
      }
      case "month": {
        return allOrders.reduce<Record<string, number>>((acc, order) => {
          const monthKey = getMonthKey(order.createdAt);
          acc[monthKey] = (acc[monthKey] ?? 0) + 1;
          return acc;
        }, {});
      }
    }
  };

  const grouped = groupOrders();
  const chartData = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ key, orders: count }));

  const formatXAxisTick = (key: string) => {
    if (view === "day") {
      const d = new Date(key);
      return window.innerWidth < 600
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    if (view === "week") {
      const [year, week] = key.split("-W");
      return `W${week} ${year}`;
    }
    if (view === "month") {
      const [year, month] = key.split("-");
      return new Date(`${year}-${month}-01`).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    }
    return key;
  };

  const formatTooltipLabel = (label: string) => {
    if (view === "day") {
      return `Date: ${new Date(label).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    if (view === "week") {
      const [year, week] = label.split("-W");
      return `Week ${week}, ${year}`;
    }
    if (view === "month") {
      const [year, month] = label.split("-");
      return new Date(`${year}-${month}-01`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    return label;
  };

  const viewLabel = view === "day" ? "Day" : view === "week" ? "Week" : "Month";

  return (
    <div className="w-full pb-4 text-xs">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
          <span>
            <span className="text-foreground/80 font-medium">Orders</span>
            <span className="mx-1 text-primary">/</span>
            <span className="text-foreground/60">{viewLabel}</span>
          </span>
        </h3>
        <div className="flex sm:flex-row flex-col-reverse items-center gap-2">
          <span className="text-[10px] sm:text-xs italic text-foreground/40">
            Last {chartData.length}{" "}
            {viewLabel.toLowerCase() + (chartData.length === 1 ? "" : "s")}
          </span>
          <Select
            value={view}
            onValueChange={(v) => setView(v as "day" | "week" | "month")}
          >
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" aspect={2.5}>
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="ordersColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="60%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="#e0e7ef"
            vertical={false}
          />
          <XAxis
            dataKey="key"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatXAxisTick}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={40}
            label={{
              value: "Orders",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
              fill: "#64748b",
            }}
            padding={{ top: 10, bottom: 10 }}
          />
          <Tooltip
            wrapperClassName="!rounded-md !shadow-lg"
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#222",
              fontSize: "12px",
              padding: "10px",
            }}
            labelStyle={{
              color: "#6366f1",
              fontWeight: 500,
            }}
            cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
            formatter={(value: any) => [`${value} Orders`, ""]}
            labelFormatter={formatTooltipLabel}
          />
          <Area
            type="monotone"
            dataKey="orders"
            stroke="#6366f1"
            fill="url(#ordersColor)"
            strokeWidth={2}
            dot={{ r: 3, fill: "#6366f1", stroke: "#fff", strokeWidth: 1.5 }}
            activeDot={{
              r: 6,
              fill: "#fff",
              stroke: "#6366f1",
              strokeWidth: 2,
            }}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
