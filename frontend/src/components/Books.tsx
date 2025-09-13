import { useEffect, useState } from "react";
import { bookAPI } from "../services/api";
import type { Book, BooksResponse } from "../types";

export default function Books() {
    const [q, setQ] = useState("");
    const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
    const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
    const [availability, setAvailability] = useState("");
    const [sort, setSort] = useState<"price_asc" | "price_desc" | "title_asc" | "title_desc" | "">("");

    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const [data, setData] = useState<BooksResponse | null>(null);
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
        const q0 = sp.get("q") ?? "";
        const min0 = numOrUndef(sp.get("price_min"));
        const max0 = numOrUndef(sp.get("price_max"));
        const avail0 = sp.get("availability") ?? "";
        const sort0 = (sp.get("sort") ?? "") as typeof sort;
        const limit0 = numOrUndef(sp.get("limit")) ?? 10;
        const offset0 = numOrUndef(sp.get("offset")) ?? 0;

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
    }, [q, priceMin, priceMax, availability, sort, limit, offset, isInitialLoad]);

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
                console.log("No data available for export");
                return;
            }

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

        } catch (error) { 
            console.error("Export failed:", error)
            console.log("Export failed:", error);
        }
        
    }

    return(
        <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            
            {/*Title*/}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Books</h2>
                <div className="flex flex-wrap gap-2">
                    {hasActiveFilters() && (
                        <button
                            onClick={clearFilters}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(window.location.href);
                                console.log("Link copied to clipboard");
                            } catch {
                                prompt("Copy this URL:", window.location.href);
                            }
                        }}>
                        Copy Link
                    </button>
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={exportCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex-shrink-0 p-4 bg-slate-100 border-b border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <input
                        placeholder="Search Title"
                        value={qInput}
                        onChange={(e) => { setOffset(0); setQInput(e.target.value); }}
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                    />
                    <input 
                        placeholder="Min price"
                        type="number"
                        value={priceMin ?? ""}
                        onChange={(e) => { setOffset(0); setPriceMin(e.target.value === "" ? undefined: Number(e.target.value)); }}
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                    />
                    <input 
                        placeholder="Max price"
                        type="number"
                        value={priceMax ?? ""}
                        onChange={(e) => { setOffset(0); setPriceMax(e.target.value === "" ? undefined: Number(e.target.value)); }}
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                    />
                    <select 
                        value={availability}
                        onChange={(e) => { setOffset(0); setAvailability(e.target.value); }}
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                    >
                        <option value="">Any Availability</option>
                        <option value="in stock">In Stock</option>
                        <option value="out of stock">Out of Stock</option>
                    </select>
                    <select 
                        value={sort}
                        onChange={(e) => { setOffset(0); setSort(e.target.value as any); }}
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
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
                        className="min-w-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                    >
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                    </select>
                </div>
            </div>

            {/* Status */}
            {(loading || error) && (
                <div className="flex-shrink-0 px-4 py-2">
                    {loading && <div className="text-blue-600 font-medium text-sm">Loading...</div>}
                    {error && <div className="text-red-600 font-medium text-sm">{error}</div>}
                </div>
            )}
            
            {/* Main Content Area - Flexible height */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                {/*No Results*/}
                {!loading && !error && data && data.items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-md">
                        <div className="text-center">
                            <div className="text-gray-600 text-lg mb-4">No books match your filters</div>
                            {hasActiveFilters() && (
                                <button 
                                    onClick={clearFilters}
                                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && data && data.items.length > 0 && (
                    <div className="flex-1 flex flex-col overflow-hidden">

                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse table-auto">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        <th 
                                            scope="col" 
                                            className="w-[60%] text-left px-3 py-2.5 border-b border-gray-200 font-semibold text-sm whitespace-nowrap" 
                                            aria-sort={
                                                sort?.startsWith("title")
                                                ? (sort.endsWith("asc") ? "ascending" : "descending")
                                                : "none"
                                            }
                                        >
                                            <button
                                                onClick={() => {setOffset(0); setSort(cycleSort(sort, "title")); }}
                                                className="hover:text-blue-600 transition-colors font-semibold"
                                                aria-label="Sort by title"
                                            >
                                                Title{sortIcon("title")}
                                            </button>
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[20%] text-left px-3 py-2.5 border-b border-gray-200 font-semibold text-sm whitespace-nowrap"
                                            aria-sort={
                                                sort?.startsWith("price")
                                                ? (sort.endsWith("asc") ? "ascending" : "descending")
                                                : "none"
                                            }
                                        >
                                            <button
                                                onClick={() => { setOffset(0); setSort(cycleSort(sort, "price")); }}
                                                className="w-full text-left hover:text-blue-600 transition-colors font-semibold"                                                    
                                                aria-label="Sort by price"
                                            >
                                                Price{sortIcon("price")}
                                            </button>
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[20%] text-left px-3 py-2.5 border-b border-gray-200 font-semibold text-sm whitespace-nowrap"
                                        >
                                            Availability 
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((b: Book) => (
                                        <tr key={b.id} className="hover:bg-slate-100 transition-colors">
                                            <td className="px-3 py-2.5 border-b border-gray-100 text-sm">
                                                <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{b.title}</a>
                                            </td>
                                            <td className="px-3 py-2.5 border-b border-gray-100 text-sm font-medium" title={typeof b.price === "number" ? String(b.price) : ""}>
                                                {typeof b.price === "number" ? `£${b.price.toFixed(2)}` : "—"}
                                            </td>                                                
                                            <td className="px-3 py-2.5 border-b border-gray-100 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    b.availability === 'in stock' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {b.availability}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {!loading && !error && data && (
                            <div className="flex-shrink-0 flex items-center justify-between gap-4 bg-slate-100 p-3 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <button
                                        onClick={previousPage}
                                        disabled={offset === 0} 
                                        aria-disabled={offset === 0} 
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >                                            
                                        Prev
                                    </button>
                                    <button 
                                        onClick={nextPage} 
                                        disabled={offset + limit >= data.total} 
                                        aria-disabled={offset + limit >= data.total}
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    >
                                        Next
                                    </button>
                                </div> 
                                <div className="text-xs text-gray-600">
                                    {Math.min(offset + 1, data.total)}–{Math.min(offset + limit, data.total)} of {data.total}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
