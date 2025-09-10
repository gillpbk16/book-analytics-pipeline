import { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { WordsResponse } from "../types";




export default function TopTitleWords({ topN = 10 }: { topN? : number }) {
    const [data, setData] = useState<WordsResponse| null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        (async () => {
            try {
                const res = await bookAPI.getTitleWords(topN);
                setData(res.data);
            } catch (e) {
                console.error(e);
                setError("Failed to load Title Words");
            } finally {
                setLoading(false);
            }
        })();
    }, [topN]);

    if (loading) return <div>Loading Title Words</div>
    if (error) return <div style={{ color: "crimson" }}>{error}</div>
    if (!data || data.top.length === 0) return <div>No Words</div>

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Top Title Words</h2>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
                {data.top.map((row) => (
                    <li key={row.word} style={{ lineHeight: 1.6 }}>
                        <strong>{row.word}</strong> — {row.count}
                    </li>
                ))}
            </ol>
        </div>
    );
}
