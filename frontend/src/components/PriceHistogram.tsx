import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { bookAPI } from "../services/api";
import type { PriceBucket } from "../types";

import {
    Chart as ChartJS,
    CategoryScale, 
    LinearScale,
    BarElement, 
    Title as ChartTitle, 
    Tooltip, 
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

// Loading skeleton matching the chart component layout
function ChartLoadingSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="flex-1 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

// Interactive price distribution histogram with configurable bucket sizes
export default function PriceHistogram() {
    const [buckets, setBuckets] = useState<PriceBucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localBucketSize, setLocalBucketSize] = useState(
      () => Number(localStorage.getItem("bucketSize") ?? 10)
    );

    useEffect(() => {
      let cancelled = false;
      setLoading(true);

      (async () => {
      try {
        const res = await bookAPI.getPriceBuckets(localBucketSize);
        if (cancelled) return;
        setBuckets(res.data.buckets);
        setError(null);
      } catch {
        if (cancelled) return;
        setError("Failed to load price buckets");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
      })();

      return () => { cancelled = true; };
    }, [localBucketSize]);

    useEffect( () => {
      localStorage.setItem("bucketSize", String(localBucketSize));
    }, [localBucketSize]);
    


  if (loading) return <ChartLoadingSkeleton />;
  if (error) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg h-full flex items-center justify-center">
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg" role="alert">
          {error}
        </div>
      </div>
    );
  }
  if (!buckets.length) {
  return (
      <div className="bg-white p-4 rounded-xl shadow-lg h-full flex items-center justify-center">
        <div className="text-gray-600">No price data available.</div>
      </div>
    );
  } 

  // Format bucket labels as price ranges
  const labels = buckets.map(b => `£${b.lower.toFixed(0)}–£${b.upper.toFixed(0)}`);
  
  const data = {
    labels,
    datasets: [
      {
        label: "Books",
        data: buckets.map(b => b.count),
        backgroundColor: "rgba(139,69,238,0.8)",
        hoverBackgroundColor: "rgba(124,58,237,0.9)",
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 44,
        categoryPercentage: 0.9,
        barPercentage: 0.9,
      },
    ],
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Price Distribution</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="bucket-size" className="text-sm text-gray-600 font-medium">
            Bucket Size
          </label>
          <select
            id="bucket-size"
            value={localBucketSize}
            onChange={(e) => setLocalBucketSize(Number(e.target.value))}
            className="h-9 rounded-md border border-violet-300 bg-violet-50 px-3 text-sm text-violet-700 font-medium hover:bg-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
      
      {/*Chart*/}
      <div className="flex-1 min-h-[16rem]">
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.parsed.y} books`,
                }
              }
            },
            scales: {
              x: { 
                grid: { color: '#f3f4f6'},
                ticks: { 
                  font: { size: 12 } 
                },
              },
              y: { 
                beginAtZero: true, 
                grid: { color: '#f3f4f6'},
                ticks: { 
                  font: { size: 12 },
                  stepSize: 1 
                },

              },
            },
          }}
        />
      </div>
    </div>
  );
}
