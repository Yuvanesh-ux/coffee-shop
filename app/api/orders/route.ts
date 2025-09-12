import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    let ordersQuery = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'product_name', p.name
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
        `;

    const queryParams: unknown[] = [];

    if (user.role !== "admin") {
      ordersQuery += " WHERE o.user_id = $1";
      queryParams.push(user.id);
    }

    ordersQuery += " GROUP BY o.id ORDER BY o.created_at DESC";

    const result = await query(ordersQuery, queryParams);

    // Convert price fields to numbers
    const orders = result.rows.map((order) => ({
      ...order,
      total_amount: parseFloat(order.total_amount),
      items:
        order.items?.map(
          (item: { unit_price: string; [key: string]: unknown }) => ({
            ...item,
            unit_price: parseFloat(item.unit_price),
          })
        ) || [],
    }));

    return NextResponse.json(orders);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = requireAuth(request);
    const { items } = await request.json();

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Calculate total and create order
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Use SELECT ... FOR UPDATE to lock the row for this transaction
      const productResult = await client.query(
        "SELECT * FROM products WHERE id = $1 FOR UPDATE",
        [item.product_id]
      );
      const product = productResult.rows[0];

      if (!product) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 400 }
        );
      }

      if (product.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }

    // Create order
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *",
      [user.id, totalAmount]
    );

    const order = orderResult.rows[0];

    // Add order items and update stock
    for (const item of orderItems) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [order.id, item.product_id, item.quantity, item.unit_price]
      );

      // Update stock
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    client.release();
    return NextResponse.json({
      message: "Order created successfully",
      order_id: order.id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
