import { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { Booksresponse } from "../types";

const container: React.CSSProperties = { padding: 24, display: "grid", gap: 16, maxWidth: 1100, margin: "0 auto" };
const controls: React.CSSProperties = { display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" };
const tableWrap: React.CSSProperties = { overflowX: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee", fontWeight: 600, fontSize: 14 };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f2f2f2", fontSize: 14 };
const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const btnDisabled: React.CSSProperties = { ...btn, opacity: 0.5, cursor: "not-allowed" };

export default function Books() {
    const [q, setQ] = useState("");
    const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
    const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
    const [availability, setAvailability] = useState("");
    const [sort, setSort] = useState<"price_asc" | "price_desc" | "title_asc" | "title_desc" | "">("");

    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const [data, setData] = useState<Booksresponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchBooks() {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                limit, 
                offset,
            };
            if (q) params.q = q;
            if (priceMin !== undefined) params.price_min = priceMin;
            if (priceMax !== undefined) params.price_max = priceMax;
            if (availability) params.availability = availability;
            if (sort) params.sort = sort;

            const res = await bookAPI.getBooks(params);
            setData(res.data);
        } catch (e) {
            console.error(e);
            setError("Failed to load page.")
        } finally {
            setLoading(false);
        } 
    }

    useEffect(() => {
        fetchBooks();
    }, [q, priceMin, priceMax, availability, sort, limit, offset]);

    function nextPage() {
        if (!data) return;
        const next = offset + limit;
        if (next < data.total) {
            setOffset(next);
        }
    }

    function previousPage() {
        const previous = Math.max(0, offset - limit);
        setOffset(previous);
    }

    return(
        <div style={container}>
            <h2 style={{ margin: 0}}>Books</h2>

            {/* Filters */}
            <div style={controls}>
                <input
                    placeholder="Search Title"
                    value={q}
                    onChange={(e) => { setOffset(0); setQ(e.target.value); }}
                />
                <input 
                    placeholder="Min price"
                    type="number"
                    value={priceMin ?? ""}
                    onChange={(e) => { setOffset(0); setPriceMin(e.target.value === "" ? undefined: Number(e.target.value)); }}
                />
                <input 
                    placeholder="Max price"
                    type="number"
                    value={priceMax ?? ""}
                    onChange={(e) => { setOffset(0); setPriceMax(e.target.value === "" ? undefined: Number(e.target.value)); }}
                />
                <select 
                    value={availability}
                    onChange={(e) => { setOffset(0); setAvailability(e.target.value); }}
                >
                    <option value="">Any Availability</option>
                    <option value="in stock">In Stock</option>
                    <option value="out of stock">Out of Stock</option>
                </select>
                <select 
                    value={sort}
                    onChange={(e) => { setOffset(0); setSort(e.target.value as any); }}
                >
                    <option value="">Sort..</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                    <option value="title_asc">Title A–Z</option>
                    <option value="title_desc">Title Z–A</option>
                </select>
                <select 
                    value={limit}
                    onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
                >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                </select>
            </div>

            {/* Status */}
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: "crimson" }}>{error}</div>}

            {/* Table */}
            {!loading && !error && data && data.items.length === 0 && (
                <div>No books match your filters</div>
            )}

            {!loading && !error && data && data.items.length > 0 && (
                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={th}>Title</th>
                                <th style={th}>Price</th>
                                <th style={th}>Availability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((b) => (
                                <tr key={b.id}>
                                    <td style={td}>
                                        <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a>
                                    </td>
                                    <td style={td}>
                                        {typeof b.price === "number" ? `£${b.price.toFixed(2)}` : "—"}
                                    </td>
                                    <td style={td}>{b.availability}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && data && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={previousPage} disabled={offset === 0} style={offset === 0 ? btnDisabled : btn}>Prev</button>
                    <button onClick={nextPage} disabled={offset + limit >= data.total} style={offset === 0 ? btnDisabled : btn}>Next</button>
                    <div style={{ marginLeft: 8, color: "#666" }}>
                        Showing {Math.min(offset + 1, data.total)}–
                        {Math.min(offset + limit, data.total)} of {data.total}
                    </div>
                </div>
            )}
        </div>
    );
}
