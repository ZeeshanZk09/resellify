"use client";

import { useEffect, useState } from "react";
import { getVisitsReport } from "@/actions/pageVisit/pageVisitServices";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "rgba(54, 162, 235, 0.6)",
  "rgba(255, 206, 86, 0.6)",
  "rgba(255, 99, 132, 0.6)",
  "rgba(75, 192, 192, 0.6)",
  "rgba(153, 102, 255, 0.6)",
  "rgba(255, 159, 64, 0.6)",
];

// helper to pick colors (repeat if fewer than data)
function getColors(count: number) {
  let arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(COLORS[i % COLORS.length]);
  }
  return arr;
}

// Move fetch to client
export default function ViewsReport() {
  const [report, setReport] = useState<null | {
    topPaths: { path: string | null; count: number }[];
    totalVisits: number;
    uniqueVisitors: number;
    visitsPerDay: { date: string; count: number }[];
    topReferrers: { referrer: string | null; count: number }[];
  }>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getVisitsReport();
      // Defensive: fallback to {} if error
      if (mounted && res && res.res) {
        setReport(res.res);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="max-w-xl w-full mx-auto">
        <span className="text-muted-foreground text-sm">
          Loading traffic report...
        </span>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="max-w-xl w-full mx-auto">
        <span className="text-red-500 text-sm">
          Could not load traffic report.
        </span>
      </section>
    );
  }

  const { topPaths, totalVisits, uniqueVisitors, topReferrers } = report;

  const pathsPieData = {
    labels: topPaths.map((item) => item.path ?? "Unknown"),
    datasets: [
      {
        data: topPaths.map((item) => item.count ?? 0),
        backgroundColor: getColors(topPaths.length),
        borderColor: getColors(topPaths.length).map((c) =>
          c.replace("0.6", "1")
        ),
        borderWidth: 1,
        label: "Top 5 Most Visited Pages",
      },
    ],
  };

  const referrersPieData = {
    labels: topReferrers.map((item) => item.referrer ?? "Direct/None"),
    datasets: [
      {
        data: topReferrers.map((item) => item.count ?? 0),
        backgroundColor: getColors(topReferrers.length),
        borderColor: getColors(topReferrers.length).map((c) =>
          c.replace("0.6", "1")
        ),
        borderWidth: 1,
        label: "Top 5 Referrers",
      },
    ],
  };

  return (
    <section className="w-full">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-center lg:text-left wrap-break-word">
        Traffic Report
      </h2>

      {/* Stats cards: stacked on small screens, side-by-side on md+ */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="min-w-0 bg-muted rounded-xl p-4 md:p-5">
          <div className="text-xs md:text-sm text-muted-foreground">
            Total Visits
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold break-all">
            {totalVisits.toLocaleString()}
          </div>
        </div>
        <div className="min-w-0 bg-muted rounded-xl p-4 md:p-5">
          <div className="text-xs md:text-sm text-muted-foreground">
            Unique Visitors
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold break-all">
            {uniqueVisitors.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Most Visited Pages section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        <section className="flex flex-col min-w-0">
          <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-3 md:mb-4 wrap-break-word">
            Most Visited Pages (Top 5)
          </h3>
          {topPaths.length === 0 ? (
            <div className="text-muted-foreground italic text-sm">
              No page visit data available.
            </div>
          ) : (
            <ul className="space-y-2">
              {topPaths.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-sm md:text-base"
                >
                  <span
                    className="truncate mr-2"
                    title={item.path ?? "Unknown"}
                  >
                    {item.path ?? "Unknown"}
                  </span>
                  <span className="font-medium">{item.count ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pie chart wrapper keeps aspect ratio and centers */}
        <div className="w-full h-auto max-w-full">
          {topPaths.length > 0 && (
            <Pie
              data={pathsPieData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 12,
                      padding: 10,
                      font: { size: 11 },
                    },
                  },
                },
              }}
              className="w-full h-64 sm:h-72 md:h-80 lg:h-96"
            />
          )}
        </div>
      </div>

      {/* Top Referrers section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <section className="flex flex-col min-w-0">
          <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-3 md:mb-4 wrap-break-word">
            Top Referrers (Top 5)
          </h3>
          {topReferrers.length === 0 ? (
            <div className="text-muted-foreground italic text-sm">
              No referrer data available.
            </div>
          ) : (
            <ul className="space-y-2">
              {topReferrers.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-sm md:text-base"
                >
                  <span
                    className="truncate mr-2"
                    title={item.referrer ?? "Direct/None"}
                  >
                    {item.referrer ?? "Direct/None"}
                  </span>
                  <span className="font-medium">{item.count ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          {topReferrers.length > 0 && (
            <Pie
              data={referrersPieData}
              options={{ maintainAspectRatio: true }}
              className="max-h-64 sm:max-h-80 md:max-h-96 w-full"
            />
          )}
        </div>
      </div>
    </section>
  );
}
