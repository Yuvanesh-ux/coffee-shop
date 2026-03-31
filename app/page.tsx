"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./components/AuthContext";
import AuthForm from "./components/AuthForm";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchProducts();
      setShowAuthForm(false);
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const addToCart = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cart.find((item) => item.product_id === productId);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: productId,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const checkout = async () => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      if (response.ok) {
        setCart([]);
        alert("Order placed successfully!");
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (showAuthForm) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ☕ Coffee Shop
              </h1>
              <p className="text-gray-600">Premium coffee and pastries</p>
            </div>

            <AuthForm
              isLogin={showLogin}
              onSuccess={() => setShowAuthForm(false)}
            />

            <div className="text-center mt-4">
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="text-blue-600 hover:underline"
              >
                {showLogin
                  ? "Don't have an account? Register"
                  : "Already have an account? Login"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ☕ Coffee Shop
            </h1>
            <p className="text-gray-600 mb-8">Premium coffee and pastries</p>

            <button
              onClick={() => setShowAuthForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Login / Register to Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">☕ Coffee Shop</h1>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.email}</span>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </main>

      <Cart
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={checkout}
      />
    </div>
  );
}
