"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
  }[];
}

// Utility function to sanitize diagnostic command input
function sanitizeDiagnosticCommand(input: string): string {
  // Only allow alphanumeric, space, dash, underscore, and period
  // Disallow any shell metacharacters or chaining
  return input.replace(/[^a-zA-Z0-9 _.-]/g, "").replace(/\s+/g, ' ').trim();
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    stock_quantity: "",
  });
  const [diagnosticCommand, setDiagnosticCommand] = useState("");
  const [diagnosticResult, setDiagnosticResult] = useState("");

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchProducts();
      fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity),
        }),
      });

      if (response.ok) {
        setNewProduct({
          name: "",
          description: "",
          price: "",
          image_url: "",
          stock_quantity: "",
        });
        setShowAddProduct(false);
        fetchProducts();
      } else {
        alert("Failed to add product");
      }
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product");
    }
  };

  const runDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize the diagnostic command before sending to backend
    const sanitizedCommand = sanitizeDiagnosticCommand(diagnosticCommand);
    try {
      const response = await fetch("/api/admin/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: sanitizedCommand }),
      });

      const data = await response.json();
      if (response.ok) {
        setDiagnosticResult(JSON.stringify(data, null, 2));
      } else {
        setDiagnosticResult(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Diagnostic failed:", error);
      setDiagnosticResult(`Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please login to access this page.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Admin access required.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Back to Shop
            </Link>
            <span className="text-gray-600">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded ${
                activeTab === "products"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`px-4 py-2 rounded ${
                activeTab === "diagnostics"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              System Diagnostics
            </button>
          </nav>
        </div>

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Products</h2>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Product
              </button>
            </div>

            {showAddProduct && (
              <form
                onSubmit={addProduct}
                className="bg-white p-6 rounded-lg shadow-md mb-6"
              >
                <h3 className="text-lg font-bold mb-4">Add New Product</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Orders</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">Order #{order.id}</h3>
                      <p className="text-gray-600">User ID: {order.user_id}</p>
                      <p className="text-gray-600">Status: {order.status}</p>
                      <p className="text-gray-600">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {order.items && order.items[0] && (
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {item.product_name} x{item.quantity} @ $
                            {item.unit_price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <div>
            <h2 className="text-xl font-bold mb-6">System Diagnostics</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <form onSubmit={runDiagnostic}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnostic Command
                  </label>
                  <input
                    type="text"
                    value={diagnosticCommand}
                    onChange={(e) => setDiagnosticCommand(e.target.value)}
                    placeholder="Enter diagnostic command..."
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Run Diagnostic
                </button>
              </form>
            </div>

            {diagnosticResult && (
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="text-sm whitespace-pre-wrap">
                  {diagnosticResult}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
