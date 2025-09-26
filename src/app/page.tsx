"use client";

import { useState } from 'react';
import { createOrder, confirmPayment } from '@/services/api';
import { ThemeToggle } from '@/components/theme-toggle'; // Pastikan ini ada

// --- Tipe Data (Diperbarui) ---
type ProductVariant = {
  id: number;
  name: string;
  price: number;
  productName: string;
};

type Topping = {
  id: number;
  name: string;
  price: number;
};

type CartItem = {
  id: string; // ID unik untuk item di keranjang, cth: "101-201"
  variantId: number;
  name: string;
  price: number;
  quantity: number;
  topping?: Topping;
};

// --- DATA DUMMY (ganti dengan fetch dari backend Anda) ---
const DUMMY_VARIANTS: ProductVariant[] = [
  { id: 101, name: "Isi 4", price: 22000, productName: "Dimsum Mentai" },
  { id: 102, name: "Isi 4", price: 20000, productName: "Dimsum Original" },
  { id: 103, name: "Isi 6", price: 30000, productName: "Dimsum Mentai" },
  { id: 104, name: "Isi 6", price: 28000, productName: "Dimsum Original" },
];

const DUMMY_TOPPINGS: Topping[] = [
  { id: 201, name: "Keju Quickmelt", price: 3000 },
  { id: 202, name: "Nori Flakes", price: 2000 },
  { id: 203, name: "Katsuobushi", price: 2500 },
];

// --- Komponen Utama ---
export default function CashierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{ orderId: string, totalAmount: number } | null>(null);

  // State untuk Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // --- Fungsi-fungsi Pengelola Keranjang (Cart Management) ---

  const openToppingModal = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowToppingModal(true);
  };

  const addToCart = (variant: ProductVariant, topping: Topping | null) => {
    const cartItemId = `${variant.id}-${topping?.id || 'none'}`;
    const itemName = `${variant.productName} (${variant.name})` + (topping ? ` + ${topping.name}` : '');
    const itemPrice = variant.price + (topping?.price || 0);

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === cartItemId);
      if (existingItem) {
        return prevCart.map((item) =>
            item.id === cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
        );
      }
      return [...prevCart, {
        id: cartItemId,
        variantId: variant.id,
        name: itemName,
        price: itemPrice,
        quantity: 1,
        topping: topping || undefined
      }];
    });
    setShowToppingModal(false); // Tutup modal setelah menambah item
  };

  const updateQuantity = (cartItemId: string, amount: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === cartItemId) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[]; // filter(Boolean) untuk menghapus item yang null
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ... (Fungsi handleProcessOrder dan handleConfirmPayment tidak berubah)
  const handleProcessOrder = async () => {
    if (!customerEmail) {
      alert("Email pelanggan tidak boleh kosong!");
      return;
    }
    setIsLoading(true);
    try {
      const orderData = {
        customerEmail,
        items: cart.map(item => ({
          variantId: item.variantId,
          toppingId: item.topping?.id || null,
          quantity: item.quantity
        }))
      };
      const response = await createOrder(orderData);
      setCurrentOrder({
        orderId: response.output_schema.orderId,
        totalAmount: response.output_schema.totalAmount,
      });
      setShowEmailModal(false);
      setShowPaymentModal(true);
    } catch (error) {
      console.log(error)
      alert("Gagal membuat pesanan!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    setIsLoading(true);
    try {
      await confirmPayment(currentOrder.orderId);
      alert(`Pembayaran untuk order ${currentOrder.orderId} berhasil dikonfirmasi!`);
      // Reset semua state
      setCart([]);
      setCustomerEmail("");
      setCurrentOrder(null);
      setShowPaymentModal(false);
    } catch (error) {
      alert("Gagal mengonfirmasi pembayaran!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header className="p-4 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-700">Saji Cashier</h1>
          <ThemeToggle />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
          {/* Product List */}
          <section className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Pilih Menu</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {DUMMY_VARIANTS.map((variant) => (
                  <button
                      key={variant.id}
                      onClick={() => openToppingModal(variant)}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:scale-105 transform transition-transform duration-200 text-left"
                  >
                    <p className="font-bold">{variant.productName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{variant.name}</p>
                    <p className="mt-2 font-semibold text-red-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(variant.price)}
                    </p>
                  </button>
              ))}
            </div>
          </section>

          {/* Order Summary */}
          <aside className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">Pesanan</h2>
            {cart.length === 0 ? (
                <p className="text-gray-500">Keranjang masih kosong.</p>
            ) : (
                <>
                  <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {cart.map((item) => (
                        <li key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 font-bold">-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 font-bold">+</button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price * item.quantity)}
                            </p>
                            <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline">Hapus</button>
                          </div>
                        </li>
                    ))}
                  </ul>
                  <div className="mt-6 border-t pt-4 dark:border-gray-700">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)}</span>
                    </div>
                    <button
                        onClick={() => setShowEmailModal(true)}
                        disabled={cart.length === 0}
                        className="w-full mt-4 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Bayar
                    </button>
                  </div>
                </>
            )}
          </aside>
        </main>

        {/* Topping Selection Modal */}
        {showToppingModal && selectedVariant && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-1">{selectedVariant.productName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedVariant.name}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Pilih Topping:</h4>
                  {DUMMY_TOPPINGS.map((topping) => (
                      <button key={topping.id} onClick={() => addToCart(selectedVariant, topping)} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between">
                        <span>{topping.name}</span>
                        <span className="font-semibold">+ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(topping.price)}</span>
                      </button>
                  ))}
                  <button onClick={() => addToCart(selectedVariant, null)} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                    Tanpa Topping
                  </button>
                </div>
                <button onClick={() => setShowToppingModal(false)} className="mt-6 w-full py-2 rounded text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700">Batal</button>
              </div>
            </div>
        )}

        {/* Email & Payment Modals (tidak berubah) */}
        {showEmailModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Masukkan Email Pelanggan</h3>
                <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-700 dark:border-gray-600 mb-4"
                />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded text-gray-600 dark:text-gray-300">Batal</button>
                  <button onClick={handleProcessOrder} disabled={isLoading} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:bg-gray-400">
                    {isLoading ? "Memproses..." : "Lanjut"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {showPaymentModal && currentOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h3 className="text-2xl font-bold mb-2">Scan untuk Membayar</h3>
                <p className="mb-4">Total: <span className="font-bold text-red-600 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentOrder.totalAmount)}</span></p>
                <div className="w-64 h-64 bg-gray-300 mx-auto my-4 flex items-center justify-center">
                  [Gambar QRIS Anda di sini]
                </div>
                <p className="text-sm text-gray-500">Order ID: {currentOrder.orderId}</p>
                <button onClick={handleConfirmPayment} disabled={isLoading} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                  {isLoading ? "Mengonfirmasi..." : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </div>
        )}
      </div>
  );
}