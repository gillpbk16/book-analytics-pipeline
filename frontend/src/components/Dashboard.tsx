import React, { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { PriceStats } from "../types";

export default function Dashboard() {
    const[priceStats, setPriceStats] = useState<PriceStats | null>(null);
    const[loading, setLoading] = useState(true);
    const[error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await bookAPI.getPriceStats();
                setPriceStats(res.data);
            } catch (e) {
                setError("Could not load price stats")
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg" role="alert">
                    {error}
                </div>
            </div>
        );
    } 

    return (
        <div className="rounded-xl border bg-white p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Stat label="With price" value={priceStats?.count ?? 0} /> 
                <Stat label="Minimum price" value={fmt(priceStats?.min)} />
                <Stat label="Average price" value={fmt(priceStats?.average)} />
                <Stat label="Maximum price" value={fmt(priceStats?.max)} />            
            </div>
        </div>
        

    );
}

function Stat({label , value}: {label: string; value: React.ReactNode}) {
    return(
        <div className="p-1.5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-200 flex flex-col items-end">
            <div className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-0.5">
                {label}
            </div>
            <div className="text-lg font-semibold text-gray-900">
                {value}
            </div>
        </div>
    );
}

function fmt( n : number | null | undefined) { 
    return typeof n === "number" ? `£${n.toFixed(2)}` : "-" ;
}


