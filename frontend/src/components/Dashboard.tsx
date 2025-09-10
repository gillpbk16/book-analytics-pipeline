import React, { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { PriceStats } from "../types";

const page: React.CSSProperties = { padding: 24, display: "grid", gap: 24, maxWidth: 1100, margin: "0 auto" };
const panel: React.CSSProperties = { background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" };

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

    if (loading) return <div>Loading..</div>;
    if (error) return <div role="alert">{error}</div>

    return (
        <div style={page}>
            <h1>Book Analytics Dashboard</h1>
            <div style={panel}>
                <Stat label="With price" value={priceStats?.count ?? 0} />
                <Stat label="min price" value={fmt(priceStats?.min)} />
                <Stat label="Avg price" value={fmt(priceStats?.average)} />
                <Stat label="max price" value={fmt(priceStats?.max)} />
            </div>
        </div>
    );
}

function Stat({label , value}: {label: string; value: React.ReactNode}) {
    return(
        <div style={{padding: 12, border: "1px solid #ddd", borderRadius: 8}}>
            <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
        </div>
    );
}

function fmt( n : number | null | undefined) { 
    return typeof n === "number" ? `£${n.toFixed(2)}` : "-" ;
}


