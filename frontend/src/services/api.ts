import axios from "axios";
import { type PriceStats, type AvailabilityResponse, type PriceBucketResponse, type Booksresponse, type WordsResponse } from "../types";


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',}
});

export const bookAPI = {
  getBooks: (params?: { 
    limit?: number; 
    offset?: number;
    q?: string;
    price_min?: number;
    price_max?: number;
    availability?: string;
    sort?: "price_asc" | "price_desc" | "title_asc" | "title_desc" ;
    }) => api.get<Booksresponse>('/books', { params }),

    getAvailability: () => api.get<AvailabilityResponse>("/analytics/availability"),
    getPriceStats: () => api.get<PriceStats>("/analytics/price-stats"),
    getPriceBuckets: (bucket_size = 10) => 
        api.get<PriceBucketResponse>("/analytics/price-buckets", {params: {bucket_size }}), 
    getTitleWords: (top_n = 10) => 
        api.get<WordsResponse>("/analytics/title-words", {params: {top_n} })
    
};

