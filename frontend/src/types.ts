export type Book = {
    id: string;
    title: string;
    url: string;
    price: number | null;
    availability: string;
}

export type Booksresponse = {
    total: number;
    items: Book[]
}

export type PriceStats = {
  count: number;
  min: number | null;
  max: number | null;
  average: number | null;
}

export type AvailabilityBucket = {
    label: string; 
    count: number;
}

export type AvailabilityResponse = {
    total: number;
    buckets: AvailabilityBucket;
}


export type PriceBucket= {
    lower: number;
    upper: number; 
    count: number; 
}

export type PriceBucketResponse = {
    buckets : PriceBucket[];
}

export type WordRow = {
    word: string;
    count: number;
}

export type WordsResponse = {
    top: WordRow[]
}