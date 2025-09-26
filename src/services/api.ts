// src/services/api.ts
import axios from 'axios';

// Definisikan tipe data sesuai DTO backend
interface OrderItemRequest {
    variantId: number;
    toppingId: number | null;
    quantity: number;
}

interface CreateOrderRequest {
    customerEmail: string;
    items: OrderItemRequest[];
}

// Buat instance axios dengan URL dasar backend Anda
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // <-- Ganti jika URL backend berbeda
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fungsi untuk mengambil daftar produk
export const getProducts = async () => {
    try {
        const response = await apiClient.get('/products');
        // Kita hanya butuh data dari output_schema
        return response.data.output_schema;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

// Fungsi untuk mengambil daftar topping
export const getToppings = async () => {
    try {
        const response = await apiClient.get('/toppings');
        return response.data.output_schema;
    } catch (error) {
        console.error("Error fetching toppings:", error);
        throw error;
    }
};


// Fungsi untuk membuat pesanan baru
export const createOrder = async (orderData: CreateOrderRequest) => {
    try {
        console.log('orderData: ', orderData);
        const response = await apiClient.post('/orders', orderData);
        return response.data; // Mengembalikan seluruh StandardApiResponse
    } catch (error) {
        // Handle error (misal: log atau lempar error custom)
        console.error("Error creating order:", error);
        throw error;
    }
};

// Fungsi untuk konfirmasi pembayaran
export const confirmPayment = async (orderId: string) => {
    try {
        const response = await apiClient.put(`/orders/${orderId}/payment-confirmation`);
        return response.data;
    } catch (error) {
        console.error("Error confirming payment:", error);
        throw error;
    }
};