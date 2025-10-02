import axios from 'axios';

export type UUID = string;

export interface StatusSchema {
    code: string;
    message: string;
}

export interface StandardApiResponse<T> {
    status_schema: StatusSchema;
    output_schema: T;
}

export interface ProductVariantResponse {
    variantId: UUID;
    variantName: string;
    price: number;
}

export interface ProductResponse {
    productId: UUID;
    name: string;
    description: string | null;
    imageUrl: string | null;
    active: boolean;
    variants: ProductVariantResponse[];
}

export interface ToppingResponse {
    toppingId: UUID;
    name: string;
    price: number;
    imageUrl: string | null;
    active: boolean;
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

const apiClient = axios.create({
    baseURL: 'https://saji-kitchen-service.up.railway.app/api/v1', // Sesuaikan jika perlu
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

export const getProducts = async (): Promise<ProductResponse[]> => {
    const response = await apiClient.get('/menu/products');
    return response.data;
};

export const getToppings = async (): Promise<ToppingResponse[]> => {
    const response = await apiClient.get('/menu/toppings');
    return response.data;
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<StandardApiResponse<OrderResponse>> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
};

export const confirmPayment = async (orderId: string) => {
    const response = await apiClient.put(`/orders/${orderId}/payment-confirmation`);
    return response.data;
};

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};