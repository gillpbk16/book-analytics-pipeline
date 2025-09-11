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
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [qInput, setQInput] = useState<string>("");

    function cycleSort(current: typeof sort, field: "price" | "title") {
        const asc = (field + "_asc") as typeof sort;
        const desc = (field + "_desc") as typeof sort;
        
        if (current === asc) return desc;
        if (current === desc) return "";
        return asc;
    }

    function sortIcon(field: "price" | "title") {
        if (sort == field + "_asc") return " ▲";
        if (sort == field + "_desc") return " ▼";
        return "";
    }

    function buildAPIParams() {
        const params: any = {
                limit, 
                offset,
        };
        if (q) params.q = q;
        if (priceMin !== undefined) params.price_min = priceMin;
        if (priceMax !== undefined) params.price_max = priceMax;
        if (availability) params.availability = availability;
        if (sort) params.sort = sort;
        return params
    }

    async function fetchBooks() {
        try {
            setLoading(true);
            setError(null);

            const params = buildAPIParams();

            console.log("fetchBooks called with params:", params);
            console.log("Current state:", { q, priceMin, priceMax, availability, sort, limit, offset });

            const res = await bookAPI.getBooks(params);
            setData(res.data);
        } catch (e) {
            console.error(e);
            setError("Failed to load page.")
        } finally {
            setLoading(false);
        } 
    }

    function numOrUndef(v: string | null) {
        if (v === null || v === "") return undefined
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }

    useEffect( () => {
        const sp = new URLSearchParams(window.location.search);

        console.log("Full URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("URLSearchParams object:", sp.toString());

        const q0 = sp.get("q") ?? "";
        const min0 = numOrUndef(sp.get("price_min"));
        const max0 = numOrUndef(sp.get("price_max"));
        const avail0 = sp.get("availability") ?? "";
        const sort0 = (sp.get("sort") ?? "") as typeof sort;
        const limit0 = numOrUndef(sp.get("limit")) ?? 10;
        const offset0 = numOrUndef(sp.get("offset")) ?? 0;

        console.log("Parsed values:", { q0, min0, max0, avail0, sort0, limit0, offset0 });

        setQ(q0);
        setPriceMin(min0);
        setPriceMax(max0);
        setAvailability(avail0);
        setSort(sort0);
        setLimit(limit0);
        setOffset(offset0);

        setIsInitialLoad(false);

    }, []);

    useEffect(() => {
        setQInput(q);
    }, [q]);

    useEffect( () => {
        const t = setTimeout( () => {
            if (qInput !== q) {
                setOffset(0);
                setQ(qInput.trim());
            }
        }, 300);
        return () => clearTimeout(t);
    }, [qInput]);

    useEffect(() => {
        if (!isInitialLoad) {
            fetchBooks();
            
            const sp =  new URLSearchParams()
            if (q) sp.set("q", q);
            if (priceMin !== undefined) sp.set("price_min", String(priceMin));
            if (priceMax !== undefined) sp.set("price_max", String(priceMax));
            if (availability) sp.set("availability", availability);
            if (sort) sp.set("sort", sort);
            if (limit !== 10) sp.set("limit", String(limit));
            if (offset !== 0) sp.set("offset", String(offset));
        
            const qs = sp.toString();
            const newURL = qs ? `?${qs}` : window.location.pathname;
            window.history.replaceState(null, "", newURL);
        }   
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

    function hasActiveFilters() {
        return !!(
            q || 
            priceMin !== undefined || 
            priceMax !== undefined || 
            availability || 
            sort
        );
    }
    function clearFilters() {
        setQ("");
        setQInput("");
        setPriceMax(undefined);
        setPriceMin(undefined);
        setAvailability("");
        setSort("");
        setOffset(0);
    }

    async function exportCSV() {  
        try {
            const params = buildAPIParams();
            const res = await bookAPI.getBooks(params);
            const items = res.data.items;

            if (!items || items.length === 0) {
                alert("No data to export.");
                return;
            }

            console.log("Items to export:", items);

            const headers = ["ID", "Title", "Price", "Availability", "URL"];

            const csvRows = [
                headers.join(","),
                ...items.map(book => [
                    book.id || "",
                    `"${(book.title || '').replace(/"/g, '""')}"`,
                    typeof book.price === 'number' ? book.price.toFixed(2) : '',
                    `"${(book.availability || '').replace(/"/g, '""')}"`,
                    book.url || ""
                ].join(','))
            ];

            console.log("CSV rows:", csvRows);
            console.log("Sample book object:", items[0]);

            const csvContent = csvRows.join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'books_export.csv';
            document.body.appendChild(link);
            link.click();


            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log("CSV download triggered");

        } catch (error) { 
            console.error("Export failed:", error)
            alert("Export failed.");
        }
        
    }

    return(
        <div style={container}>
            <h2 style={{ margin: 0}}>Books</h2>

            {/* Filters */}
            <div style={controls}>
                <input
                    placeholder="Search Title"
                    value={qInput}
                    onChange={(e) => { setOffset(0); setQInput(e.target.value); }}
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
                <button
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(window.location.href);
                            alert("Link Copied.");
                        } catch {
                            prompt("Copy this URL:", window.location.href);
                        }
                    }}>
                    Copy Link
                </button>
                <button onClick={exportCSV}>Export CSV</button>
            </div>

            {/* Status */}
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: "crimson" }}>{error}</div>}

            {/* Table */}
            {!loading && !error && data && data.items.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                    <div>No books match your filters</div>
                    {hasActiveFilters() && (
                        <button 
                            onClick={clearFilters}
                            style={{ ...btn, marginTop: "12px" }}
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && data && data.items.length > 0 && (
                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={th}>
                                    <button
                                        onClick={() => {setOffset(0); setSort(cycleSort(sort, "title")); }}
                                        style={{ all: "unset", cursor: "pointer", fontWeight: 600 }}
                                        aria-label="Sort by title"
                                        >
                                            Title{sortIcon("title")}
                                        </button>
                                </th>
                                <th style={th}>
                                    <button
                                        onClick={() => { setOffset(0); setSort(cycleSort(sort, "price")); }}
                                        style={{ all: "unset", cursor: "pointer", fontWeight: 600 }}
                                        aria-label="Sort by price"
                                    >
                                        Price{sortIcon("price")}
                                    </button>
                                </th>
                                <th style={th}>Availability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((b) => (
                                <tr key={b.id}>
                                    <td style={td}>
                                        <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a>
                                    </td>
                                    <td style={td} title={typeof b.price === "number" ? String(b.price) : ""}>
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
                    <button onClick={previousPage} disabled={offset === 0} aria-disabled={offset === 0} style={{ opacity: offset === 0 ? 0.5 : 1}}>Prev</button>
                    <button onClick={nextPage} disabled={offset + limit >= data.total} aria-disabled={offset + limit >= data.total} style={offset + limit >= data.total ? btnDisabled : btn}>Next</button>
                    <div style={{ marginLeft: 8, color: "#666" }}>
                        Showing {Math.min(offset + 1, data.total)}–
                        {Math.min(offset + limit, data.total)} of {data.total}
                    </div>
                </div>
            )}
        </div>
    );
}
