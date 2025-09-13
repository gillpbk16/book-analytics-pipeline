import { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { WordsResponse } from "../types";

export default function TopTitleWords() {
    const [data, setData] = useState<WordsResponse| null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [topN, setTopN] = useState(() =>
        typeof window !== "undefined"
            ? Number(localStorage.getItem("topN") ?? 10)
            : 10
    );

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

    useEffect(() => {
        localStorage.setItem("topN", String(topN));
    }, [topN]);

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">
                        Loading Title Words...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg" role="alert">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.top.length === 0) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">
                        No words.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-md h-full flex flex-col">

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Title Words</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="top-n" className="text-sm text-gray-600 font-medium">
                    Top N
                    </label>
                    <select
                    id="top-n"
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="h-9 rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm text-blue-700 font-medium hover:bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    </select>
                </div>
            </div>
            
            <ul className="flex-1 overflow-auto divide-y divide-gray-200">
                {data.top.map((row, i) => (
                    <li
                    key={row.word} 
                    className="flex items-center justify-between py-2 px-1 hover:bg-ray-50 rounded-md transition"
                    >
                        <div className="flex items center gap-3">
                            <span className="text-sm text-gray-400 w-6 text-right">{i + 1}.</span>
                            <span className="text-sm font-medium text-gray-900">{row.word}</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            {row.count}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
