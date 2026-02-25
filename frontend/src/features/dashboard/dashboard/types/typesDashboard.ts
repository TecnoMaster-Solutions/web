
export interface TotalSales{
    month: string,
    day?: number,
    total: number,
    amt: number
}   

export interface CategoryandProducts{
    category: string,
    value: number
    [key: string]: string | number;
}

export interface OrderService{
    state: string,
    value: number,
    total: number
}

export interface Appointment{
    state: string,
    value: number,
    total: number
}