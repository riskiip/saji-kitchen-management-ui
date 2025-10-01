// src/services/api.ts
import axios from 'axios';

// ===================================================================
// 1. DEFINISIKAN ULANG TIPE DATA SESUAI DTO BACKEND
// ===================================================================
export type UUID = string;

export interface StandardApiResponse<T> {
    status_schema: any; // Anda bisa definisikan lebih detail jika perlu
    output_schema: T;
}

export interface ProductVariantResponse {
    variantId: UUID;
    name: string;
    price: number;
}

export interface ProductResponse {
    productId: UUID;
    name: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    variants: ProductVariantResponse[];
}

export interface ToppingResponse {
    toppingId: UUID;
    name: string;
    price: number;
    imageUrl: string | null;
    isActive: boolean;
}

export interface OrderItemRequest {
    variantId: UUID;
    toppingId: UUID | null;
    quantity: number;
}

export interface CreateOrderRequest {
    customerEmail: string;
    items: OrderItemRequest[];
}

export interface OrderResponse {
    orderId: string;
    totalAmount: number;
    paymentStatus: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

// ===================================================================
// 2. BUAT API CLIENT DENGAN INTERCEPTOR
// ===================================================================
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Sesuaikan jika perlu
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// ===================================================================
// 3. PERBAIKI FUNGSI-FUNGSI API
// ===================================================================

export const getProducts = async (): Promise<ProductResponse[]> => {
    const response = await apiClient.get('/menu/products');
    return response.data; // <-- KOREKSI: Tidak ada lagi 'output_schema'
};

export const getToppings = async (): Promise<ToppingResponse[]> => {
    const response = await apiClient.get('/menu/toppings');
    return response.data; // <-- KOREKSI: Tidak ada lagi 'output_schema'
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<StandardApiResponse<OrderResponse>> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data; // Sekarang tipe kembaliannya cocok dengan struktur JSON asli
};

export const confirmPayment = async (orderId: string) => {
    // <-- KOREKSI: Endpoint dan method disesuaikan
    const response = await apiClient.put(`/orders/${orderId}/payment-confirmation`);
    return response.data;
};

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};