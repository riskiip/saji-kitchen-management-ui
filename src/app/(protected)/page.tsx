"use client";

import { useState, useEffect } from 'react';
import { createOrder, confirmPayment, getProducts, getToppings } from '@/services/api';
import {useRouter} from "next/navigation";
import Image from "next/image";

// --- Tipe Data ---
type ProductVariant = {
  id: number;
  name: string;
  price: number;
  productName: string;
  imageUrl?: string; // <-- Tambahan (opsional)
  description?: string; // <-- Tambahan (opsional)
};

type Topping = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
};

type CartItem = {
  id: string; // ID unik untuk item di keranjang, cth: "101-201"
  variantId: number;
  name: string;
  price: number;
  quantity: number;
  topping?: Topping;
};


// --- Komponen Utama ---
function CashierPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{ orderId: string, totalAmount: number } | null>(null);

  // State untuk Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Hapus token dari penyimpanan
    router.push('/login'); // Arahkan kembali ke halaman login
  };

  // --- Mengambil Data Awal ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productData, toppingData] = await Promise.all([
          getProducts(),
          getToppings()
        ]);
        setProducts(productData);
        setToppings(toppingData);
      } catch (error) {
        console.error("Failed to load initial data", error);
        alert("Gagal memuat data dari server!");
      } finally {
        setIsMenuLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Fungsi Pengelola Keranjang ---
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
    setShowToppingModal(false);
  };

  const updateQuantity = (cartItemId: string, amount: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === cartItemId) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- Fungsi Proses Pembayaran ---
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
      <div className="min-h-screen bg-[#FFF3D9] text-[#4a4a4a]">
        <header className="p-4 shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#940303]">Saji Cashier</h1>
          <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#940303] rounded-md hover:bg-red-700"
              aria-label="Logout"
          >
            Logout
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
          <section className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Pilih Menu</h2>
            {isMenuLoading ? (
                <p>Memuat menu...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((variant) => (
                      <button
                          key={variant.id}
                          onClick={() => openToppingModal(variant)}
                          className="bg-[#ffe89e] text-[#4a4a4a] rounded-lg shadow hover:scale-105 transform transition-transform duration-200 text-left overflow-hidden"
                      >
                        {variant.imageUrl && (
                            <div className="w-full h-32 relative">
                                <Image
                                    src={variant.imageUrl}
                                    alt={variant.productName}
                                    layout="fill"
                                    objectFit="cover"
                                />
                            </div>
                        )}
                        <div className="p-4">
                            <p className="font-bold">{variant.productName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{variant.name}</p>
                            <p className="mt-2 font-semibold text-red-600">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(variant.price)}
                            </p>
                        </div>
                      </button>
                  ))}
                </div>
            )}
          </section>

          <aside className="bg-[#ffe89e]  p-6 rounded-lg shadow-lg h-fit">
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
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-[#940303] text-[#fff] font-bold">-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-[#940303] text-[#fff] font-bold">+</button>
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
                        className="w-full mt-4 bg-[#940303] text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Bayar
                    </button>
                  </div>
                </>
            )}
          </aside>
        </main>

        {showToppingModal && selectedVariant && (
            <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-80 flex items-center justify-center p-4">
              <div className="bg-[#ffe89e] p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-1">{selectedVariant.productName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedVariant.name}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Pilih Topping:</h4>
                  {toppings.map((topping) => (
                      <button key={topping.id} onClick={() => addToCart(selectedVariant, topping)} className="w-full text-left p-3 rounded-lg hover:bg-[#e91e63] hover:text-[#fff] flex items-center justify-between">
                        <div className="flex items-center">
                          {topping.imageUrl && (
                            <div className="w-16 h-16 relative mr-4">
                              <Image
                                src={topping.imageUrl}
                                alt={topping.name}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md"
                              />
                            </div>
                          )}
                          <span>{topping.name}</span>
                        </div>
                        <span className="font-semibold">+ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(topping.price)}</span>
                      </button>
                  ))}
                  <button onClick={() => addToCart(selectedVariant, null)} className="w-full text-left p-3 rounded-lg hover:bg-[#e91e63] hover:text-[#fff] font-semibold">
                    Tanpa Topping
                  </button>
                </div>
                <button onClick={() => setShowToppingModal(false)} className="mt-6 w-full py-2 rounded bg-[#940303] text-[#fff]">Batal</button>
              </div>
            </div>
        )}

        {showEmailModal && (
            <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-50 flex items-center justify-center">
              <div className="bg-[#ffe89e] p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Masukkan Email Pelanggan</h3>
                <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full p-2 border rounded dark:border-gray-600 mb-4 text-black"
                />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded text-black">Batal</button>
                  <button onClick={handleProcessOrder} disabled={isLoading} className="px-6 py-2 bg-[#940303] text-white font-bold rounded hover:bg-red-700 disabled:bg-gray-400">
                    {isLoading ? "Memproses..." : "Lanjut"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {showPaymentModal && currentOrder && (
            <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-50 flex items-center justify-center">
              <div className="bg-[#ffe89e] p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h3 className="text-2xl font-bold mb-2">Scan untuk Membayar</h3>
                <p className="mb-4">Total: <span className="font-bold text-red-600 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentOrder.totalAmount)}</span></p>
                <div className="mx-auto my-4 flex items-center justify-center">
                  <Image
                      src="/qris-dana.png"
                      alt=""
                      width={256}
                      height={362.8}/>
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

export default CashierPage;