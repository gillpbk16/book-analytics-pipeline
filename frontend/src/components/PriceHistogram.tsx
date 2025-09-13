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
        console.log("Histogram raw data:", res.data);
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
    


  if (loading || error || !buckets.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg h-full flex items-center justify-center">
        {loading && <div className="text-gray-600">Loading histogram…</div>}
        {error && (
          <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && !buckets.length && (
          <div className="text-gray-600">No price data available.</div>
        )}
      </div>
    );
  }

  const labels = buckets.map(b => `£${b.lower.toFixed(0)}–£${b.upper.toFixed(0)}`);
  const data = {
    labels,
    datasets: [
      {
        label: "Books",
        data: buckets.map(b => b.count),
        backgroundColor: "rgba(59,130,246,0.8)", 
        hoverBackgroundColor: "rgba(37,99,235,0.9)", 
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
      
      {/*Header*/}
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
            className="h-9 rounded-md border border-blue-300 bg-blue-50 px-3 text-sm text-blue-700 font-medium hover:bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
