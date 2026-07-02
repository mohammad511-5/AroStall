import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { user: null, error: 'No token provided' };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null };
}

// Health check endpoint
app.get("/make-server-f343f1a0/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Signup endpoint
app.post('/make-server-f343f1a0/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      createdAt: new Date().toISOString()
    });

    // Initialize empty transaction history
    await kv.set(`transactions:${data.user.id}`, []);

    console.log(`User created successfully: ${email}`);
    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      }
    });

  } catch (error) {
    console.log(`Signup error: ${error.message}`);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Get user profile (requires auth)
app.get('/make-server-f343f1a0/profile', async (c) => {
  const { user, error } = await getAuthenticatedUser(c.req.raw);

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const profile = await kv.get(`user:${user.id}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching profile for user ${user.id}: ${error.message}`);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Create transaction (requires auth)
app.post('/make-server-f343f1a0/transaction', async (c) => {
  const { user, error } = await getAuthenticatedUser(c.req.raw);

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { items, total } = body;

    if (!items || !Array.isArray(items) || typeof total !== 'number') {
      return c.json({ error: 'Invalid transaction data' }, 400);
    }

    // Get existing transactions
    const transactions = await kv.get(`transactions:${user.id}`) || [];

    // Create new transaction
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      items,
      total,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Add to transaction history
    transactions.unshift(transaction);

    // Store updated transactions
    await kv.set(`transactions:${user.id}`, transactions);

    console.log(`Transaction created for user ${user.id}: ${transaction.id}`);
    return c.json({ success: true, transaction });

  } catch (error) {
    console.log(`Error creating transaction for user ${user?.id}: ${error.message}`);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// Get transaction history (requires auth)
app.get('/make-server-f343f1a0/transactions', async (c) => {
  const { user, error } = await getAuthenticatedUser(c.req.raw);

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const transactions = await kv.get(`transactions:${user.id}`) || [];
    return c.json({ transactions });
  } catch (error) {
    console.log(`Error fetching transactions for user ${user.id}: ${error.message}`);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Save order (called after payment submission)
app.post('/make-server-f343f1a0/save-order', async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, userId, userEmail, userName, items, total, paymentMethod, txId, phone, robloxUser } = body;

    if (!orderId || !userId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const order = {
      orderId, userId, userEmail, userName,
      items, total, paymentMethod, txId, phone, robloxUser,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store by orderId for admin lookup
    await kv.set(`order:${orderId}`, order);

    // Add to user's order list
    const userOrders = await kv.get(`orders:${userId}`) ?? [];
    userOrders.unshift(order);
    await kv.set(`orders:${userId}`, userOrders);

    console.log(`Order saved: ${orderId} for user ${userId}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error saving order: ${err.message}`);
    return c.json({ error: 'Failed to save order' }, 500);
  }
});

// Mark order as delivered (admin link from Discord)
app.get('/make-server-f343f1a0/complete-order', async (c) => {
  const orderId = c.req.query('id');
  const key = c.req.query('key');

  if (key !== 'ARO_ADMIN_9f3k2p') {
    return c.html('<html><body style="font-family:sans-serif;background:#111;color:#f87171;text-align:center;padding:60px"><h2>❌ Unauthorized</h2></body></html>', 401);
  }

  try {
    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.html('<html><body style="font-family:sans-serif;background:#111;color:#f87171;text-align:center;padding:60px"><h2>❌ Order not found</h2></body></html>', 404);
    }

    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    await kv.set(`order:${orderId}`, order);

    const userOrders = await kv.get(`orders:${order.userId}`) ?? [];
    const updated = userOrders.map((o: any) =>
      o.orderId === orderId ? { ...o, status: 'delivered', deliveredAt: order.deliveredAt } : o
    );
    await kv.set(`orders:${order.userId}`, updated);

    console.log(`Order ${orderId} marked as delivered`);
    return c.html(`<html><body style="font-family:sans-serif;background:#000;color:#facc15;text-align:center;padding:60px"><h1>✅ Order ${orderId} marked as DELIVERED!</h1><p style="color:#a3a3a3">The buyer's dashboard will now show this as delivered.</p></body></html>`);
  } catch (err) {
    console.log(`Error completing order: ${err.message}`);
    return c.html('<html><body style="font-family:sans-serif;background:#111;color:#f87171;text-align:center;padding:60px"><h2>❌ Server error</h2></body></html>', 500);
  }
});

// Get user orders (requires auth)
app.get('/make-server-f343f1a0/orders', async (c) => {
  const { user, error } = await getAuthenticatedUser(c.req.raw);
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const orders = await kv.get(`orders:${user.id}`) ?? [];
    return c.json({ orders });
  } catch (err) {
    console.log(`Error fetching orders: ${err.message}`);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

Deno.serve(app.fetch);