import { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { PriceStats, ApiResponse, StatProps } from "../types";

export default function Dashboard() {
    const[priceStats, setPriceStats] = useState<PriceStats | null>(null);
    const[loading, setLoading] = useState(true);
    const[error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const res: ApiResponse<PriceStats> = await bookAPI.getPriceStats();
                setPriceStats(res.data);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Failed to load statistics";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage error={error}/>; 

    return (
        <div className="rounded-xl bg-violet-50 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Stat label="With price" value={priceStats?.count ?? 0} /> 
                <Stat label="Minimum price" value={fmt(priceStats?.min)} />
                <Stat label="Average price" value={fmt(priceStats?.average)} />
                <Stat label="Maximum price" value={fmt(priceStats?.max)} />            
            </div>
        </div>
        

    );
}

function Stat({label , value, loading = false }: StatProps) {
    if (loading) {
        return(
            <div className="p-4 border rounded-lg bg-slate-100 animate-pulse">
                <div className="h-4 bg-violet-200 rounded mb-2"></div>
                <div className="h-8 bg-violet-200 rounded"></div>
            </div>
        );
    }
    return(
        <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:to-white hover:border-blue-200 transition-all duration-200 group">
            <div className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-2">
                {label}
            </div>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                {value}
            </div>
            <div className="h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2"></div>
        </div>
    );
}

function fmt( n : number | null | undefined) { 
    return typeof n === "number" ? `£${n.toFixed(2)}` : "-" ;
}


function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-md">
      <div className="p-6">
        <div className="mb-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg bg-slate-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-red-800 font-medium">Failed to load statistics</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-red-700 hover:text-red-900 font-medium text-sm underline"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

