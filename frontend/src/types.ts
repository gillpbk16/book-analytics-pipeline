
// Book data types
export type BookAvailability = "in stock" | "out of stock";

export type Book = {
    id: string;
    title: string;
    url: string;
    price: number | null;
    availability: BookAvailability;
}

export type BooksResponse = {
    total: number;
    items: Book[]
}

// Price analytics types
export type PriceStats = {
  count: number;
  min: number | null;
  max: number | null;
  average: number | null;
}

export type UsePriceStatsReturn = {
    priceStats: PriceStats| null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Availability analytics types
export type AvailabilityBucket = {
    label: string; 
    count: number;
}

export type AvailabilityResponse = {
    total: number;
    buckets: AvailabilityBucket[];
}

// Price histogram types
export type PriceBucket= {
    lower: number;
    upper: number; 
    count: number; 
}

export type PriceBucketResponse = {
    buckets : PriceBucket[];
}

// Title words analytics types
export type WordRow = {
    word: string;
    count: number;
}

export type WordsResponse = {
    top: WordRow[]
}

// Generic API and component types
export type ApiResponse<T> = {
    data: T;
    status: number;
    message?: string;

}

export type StatProps = {
    label: string;
    value: React.ReactNode;
    loading?: boolean;
}