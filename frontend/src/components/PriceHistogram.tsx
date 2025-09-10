import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { bookAPI } from "../services/api";
import type { PriceBucket } from "../types";

const panel: React.CSSProperties = { background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" };


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

type Props = {
    bucketSize?: number;
};

export default function PriceHistogram({ bucketSize = 10}: Props) {
    const [buckets, setBuckets] = useState<PriceBucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    (async () => {
      try {
        const res = await bookAPI.getPriceBuckets(bucketSize);
        setBuckets(res.data.buckets);
      } catch (e) {
        setError("Failed to load price buckets");
      } finally {
        setLoading(false);
      }
    })();
  }, [bucketSize]);

  if (loading) return <div>Loading histogram…</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!buckets.length) return <div>No price data available.</div>;

  const labels = buckets.map(b => `£${b.lower.toFixed(0)}–£${b.upper.toFixed(0)}`);
  const data = {
    labels,
    datasets: [
      {
        label: "Books",
        data: buckets.map(b => b.count),
      },
    ],
  };

  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0 }}>Price Distribution</h2>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" as const },
            title: { display: false, text: "" },
          },
          scales: {
            x: { ticks: { autoSkip: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }}
      />
    </div>
  );
}
