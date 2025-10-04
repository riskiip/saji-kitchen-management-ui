"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createOrder, confirmPayment, getProducts, getToppings } from '@/services/api';
import type { UUID, ProductResponse, ToppingResponse, ProductVariantResponse, CreateOrderRequest, OrderResponse } from '@/services/api';

// Tipe untuk item di dalam keranjang belanja (cart)
type CartItem = {
  cartId: string; // ID unik untuk item di keranjang, cth: "uuid-variant-uuid-topping"
  variantId: UUID;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  topping?: ToppingResponse;
};

// --- Komponen Utama ---
function CashierPage() {
  const router = useRouter();

  // State untuk data menu dari API
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [toppings, setToppings] = useState<ToppingResponse[]>([]);

  // State untuk order yang sedang dibuat
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);

  // State untuk interaksi UI
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{ variant: ProductVariantResponse; product: ProductResponse } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  // Mengambil data menu dari backend saat halaman dimuat
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productData, toppingData] = await Promise.all([getProducts(), getToppings()]);
        // Filter hanya item yang aktif untuk ditampilkan di menu
        setProducts(productData.filter(p => p.active));
        setToppings(toppingData.filter(t => t.active));
      } catch (error) {
        console.error("Gagal memuat data awal", error);
        alert("Gagal memuat data dari server!");
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleProductSelection = (variant: ProductVariantResponse, product: ProductResponse) => {
    // Logika cerdas: hanya buka modal jika nama varian mengindikasikan butuh topping
    if (variant.variantName.toLowerCase().includes('+ topping')) {
      setSelectedVariant({ variant, product });
      setShowToppingModal(true);
    } else {
      addToCart(variant, product, null);
    }
  };

  const addToCart = (variant: ProductVariantResponse, product: ProductResponse, topping: ToppingResponse | null) => {
    const cartId = `${variant.variantId}-${topping?.toppingId || 'none'}`;
    const finalPrice = variant.price + (topping?.price || 0);

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.cartId === cartId);
      if (existingItem) {
        return prevCart.map((item) =>
            item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, {
        cartId,
        variantId: variant.variantId,
        productName: product.name,
        variantName: variant.variantName,
        price: finalPrice,
        quantity: 1,
        topping: topping || undefined
      }];
    });
    setShowToppingModal(false);
  };

  const updateQuantity = (cartId: string, amount: number) => {
    setCart((prevCart) =>
        prevCart.map(item =>
            item.cartId === cartId ? { ...item, quantity: item.quantity + amount } : item
        ).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProcessOrder = async () => {
    if (!customerEmail) {
      alert("Email pelanggan tidak boleh kosong!");
      return;
    }
    setIsProcessing(true);
    try {
      const orderData: CreateOrderRequest = {
        customerEmail,
        items: cart.map(item => ({
          variantId: item.variantId,
          toppingId: item.topping?.toppingId || null,
          quantity: item.quantity
        }))
      };

      const response = await createOrder(orderData);
      setCurrentOrder(response.output_schema);
      setShowEmailModal(false);
      setShowPaymentModal(true);
    } catch {
      alert("Gagal membuat pesanan!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    setIsProcessing(true);
    try {
      await confirmPayment(currentOrder.orderId);
      alert(`Pembayaran untuk order ${currentOrder.orderId} berhasil dikonfirmasi!`);
      setCart([]);
      setCustomerEmail("");
      setCurrentOrder(null);
      setShowPaymentModal(false);
    } catch {
      alert("Gagal mengonfirmasi pembayaran!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#FFF3D9] text-[#4a4a4a]">
        <header className="p-4 shadow-md flex justify-between items-center bg-white">
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
            {isMenuLoading && <p>Memuat menu...</p>}
            {!isMenuLoading && products.length === 0 && <p className="text-gray-500">Tidak ada produk yang tersedia saat ini.</p>}
            {!isMenuLoading && products.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) =>
                      product.variants.map((variant) => (
                          <button
                              key={variant.variantId}
                              onClick={() => handleProductSelection(variant, product)}
                              className="bg-[#ffe89e] text-[#4a4a4a] rounded-lg shadow hover:scale-105 transform transition-transform duration-200 text-left overflow-hidden">
                            {product.imageUrl && (
                                <div className="w-full h-32 relative">
                                  <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" />
                                </div>
                            )}
                            <div className="p-4">
                              <p className="font-bold">{product.name}</p>
                              <p className="text-sm text-gray-600">{variant.variantName}</p>
                              <p className="mt-2 font-semibold text-red-600">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(variant.price)}
                              </p>
                            </div>
                          </button>
                      ))
                  )}
                </div>
            )}
          </section>

          <aside className="bg-[#ffe89e] p-6 rounded-lg shadow-lg h-fit">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-400">Pesanan</h2>
            {cart.length === 0 ? <p className="text-gray-500">Keranjang masih kosong.</p> : (
                <>
                  <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {cart.map((item) => (
                        <li key={item.cartId} className="flex justify-between items-center text-sm">
                          <div className="flex-1 mr-2">
                            <p className="font-semibold">{item.productName} ({item.variantName})</p>
                            {item.topping && <p className="text-xs text-gray-500">+ {item.topping.name}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <button onClick={() => updateQuantity(item.cartId, -1)} className="w-6 h-6 rounded-full bg-[#940303] text-white font-bold">-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartId, 1)} className="w-6 h-6 rounded-full bg-[#940303] text-white font-bold">+</button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.quantity)}</p>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-xs text-red-500 hover:underline">Hapus</button>
                          </div>
                        </li>
                    ))}
                  </ul>
                  <div className="mt-6 border-t pt-4 border-gray-400">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total)}</span>
                    </div>
                    <button /*onClick={() => setShowEmailModal(true)}*/ disabled={cart.length === 0} className="w-full mt-4 bg-[#940303] text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                      Bayar
                    </button>
                  </div>
                </>
            )}
          </aside>
        </main>

        {showToppingModal && selectedVariant && (
            <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-80 flex items-center justify-center p-4 z-50">
              <div className="bg-[#ffe89e] p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-1">{selectedVariant.product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedVariant.variant.variantName}</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold">Pilih Topping:</h4>
                  {toppings.map((topping) => (
                      <button key={topping.toppingId} onClick={() => addToCart(selectedVariant.variant, selectedVariant.product, topping)} className="w-full text-left p-3 rounded-lg hover:bg-red-500 hover:text-white flex items-center justify-between transition-colors">
                        <div className="flex items-center">
                          {topping.imageUrl && <Image src={topping.imageUrl} alt={topping.name} width={48} height={48} className="rounded-md mr-4" />}
                          <span>{topping.name}</span>
                        </div>
                        <span className="font-semibold">+ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(topping.price)}</span>
                      </button>
                  ))}
                  <button onClick={() => addToCart(selectedVariant.variant, selectedVariant.product, null)} className="w-full text-left p-3 rounded-lg hover:bg-gray-500 hover:text-white font-semibold">
                    Tanpa Topping
                  </button>
                </div>
                <button onClick={() => setShowToppingModal(false)} className="mt-6 w-full py-2 rounded bg-[#940303] text-white">Batal</button>
              </div>
            </div>
        )}

        {/*{showEmailModal && (*/}
        {/*    <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-50 flex items-center justify-center z-50">*/}
        {/*      <div className="bg-[#ffe89e] p-8 rounded-lg shadow-xl w-full max-w-md">*/}
        {/*        <h3 className="text-xl font-bold mb-4">Masukkan Email Pelanggan</h3>*/}
        {/*        <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="contoh@email.com" className="w-full p-2 border rounded border-gray-400 mb-4 text-black" />*/}
        {/*        <div className="flex justify-end gap-4">*/}
        {/*          <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded text-black">Batal</button>*/}
        {/*          <button onClick={handleProcessOrder} disabled={isProcessing} className="px-6 py-2 bg-[#940303] text-white font-bold rounded hover:bg-red-700 disabled:bg-gray-400">*/}
        {/*            {isProcessing ? "Memproses..." : "Lanjut"}*/}
        {/*          </button>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*)}*/}

        {showPaymentModal && currentOrder && (
            <div className="fixed inset-0 bg-[#FFF3D9] bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#ffe89e] p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h3 className="text-2xl font-bold mb-2">Scan untuk Membayar</h3>
                <p className="mb-4">Total: <span className="font-bold text-red-600 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentOrder.totalAmount)}</span></p>
                <div className="mx-auto my-4 flex items-center justify-center">
                  <Image src="/qris-dana.png" alt="QRIS Payment" width={256} height={362.8} />
                </div>
                <p className="text-sm text-gray-500">Order ID: {currentOrder.orderId}</p>
                <button onClick={handleConfirmPayment} disabled={isProcessing} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                  {isProcessing ? "Mengonfirmasi..." : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </div>
        )}
      </div>
  );
}

export default CashierPage;