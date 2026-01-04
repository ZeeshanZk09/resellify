'use client';

import { useEffect, useState } from 'react';
import { getVisitsReport } from '@/actions/pageVisit/pageVisitServices';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(255, 99, 132, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)',
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
      <section className='max-w-xl w-full mx-auto'>
        <span className='text-muted-foreground text-sm'>Loading traffic report...</span>
      </section>
    );
  }

  if (!report) {
    return (
      <section className='max-w-xl w-full mx-auto'>
        <span className='text-red-500 text-sm'>Could not load traffic report.</span>
      </section>
    );
  }

  const { topPaths, totalVisits, uniqueVisitors, topReferrers } = report;

  const pathsPieData = {
    labels: topPaths.map((item) => item.path ?? 'Unknown'),
    datasets: [
      {
        data: topPaths.map((item) => item.count ?? 0),
        backgroundColor: getColors(topPaths.length),
        borderColor: getColors(topPaths.length).map((c) => c.replace('0.6', '1')),
        borderWidth: 1,
        label: 'Top 5 Most Visited Pages',
      },
    ],
  };

  const referrersPieData = {
    labels: topReferrers.map((item) => item.referrer ?? 'Direct/None'),
    datasets: [
      {
        data: topReferrers.map((item) => item.count ?? 0),
        backgroundColor: getColors(topReferrers.length),
        borderColor: getColors(topReferrers.length).map((c) => c.replace('0.6', '1')),
        borderWidth: 1,
        label: 'Top 5 Referrers',
      },
    ],
  };

  return (
    <section className='max-w-xl w-full'>
      <h2 className='text-2xl font-bold mb-6'>Traffic Report</h2>

      <div className='flex gap-6 flex-wrap mb-8'>
        <div className='flex-1 min-w-[150px] bg-muted rounded p-4'>
          <div className='text-xs text-muted-foreground'>Total Visits</div>
          <div className='text-2xl font-semibold'>{totalVisits}</div>
        </div>
        <div className='flex-1 min-w-[150px] bg-muted rounded p-4'>
          <div className='text-xs text-muted-foreground'>Unique Visitors</div>
          <div className='text-2xl font-semibold'>{uniqueVisitors}</div>
        </div>
      </div>

      <div className='mb-8'>
        <h3 className='font-semibold text-lg mb-3'>Most Visited Pages (Top 5)</h3>
        {topPaths.length === 0 ? (
          <div className='text-muted-foreground italic text-sm'>No page visit data available.</div>
        ) : (
          <Pie data={pathsPieData} />
        )}
      </div>

      <div>
        <h3 className='font-semibold text-lg mb-3'>Top Referrers (Top 5)</h3>
        {topReferrers.length === 0 ? (
          <div className='text-muted-foreground italic text-sm'>No referrer data available.</div>
        ) : (
          <Pie data={referrersPieData} />
        )}
      </div>
    </section>
  );
}
