import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const report = url.searchParams.get("report") || "overview";
    const period = url.searchParams.get("period") || "monthly";
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin access
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    const user = await userRes.json();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=is_admin`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const profiles = await profileRes.json();
    if (!profiles?.[0]?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    // Date range calculation
    const now = new Date();
    let dateFilter = "";
    if (startDate && endDate) {
      dateFilter = `and(created_at.gte.${startDate},created_at.lte.${endDate})`;
    } else if (period === "daily") {
      const today = now.toISOString().split("T")[0];
      dateFilter = `created_at.gte.${today}`;
    } else if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dateFilter = `created_at.gte.${weekAgo}`;
    } else if (period === "monthly") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split("T")[0];
      dateFilter = `created_at.gte.${monthAgo}`;
    } else if (period === "yearly") {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split("T")[0];
      dateFilter = `created_at.gte.${yearAgo}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};

    if (report === "overview" || report === "revenue") {
      // Revenue analytics
      const ordersRes = await fetch(
        `${supabaseUrl}/rest/v1/orders?select=total_amount,discount_amount,created_at,status&${dateFilter ? dateFilter + "&" : ""}order=created_at.asc`,
        { headers }
      );
      const orders = await ordersRes.json();

      // Revenue by period
      const revenueByPeriod: Record<string, { revenue: number; orders: number; discounts: number }> = {};

      for (const order of orders || []) {
        const d = new Date(order.created_at);
        let key: string;
        if (period === "daily") key = d.toISOString().split("T")[0];
        else if (period === "weekly") {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          key = new Date(d.setDate(diff)).toISOString().split("T")[0];
        } else if (period === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        else key = `${d.getFullYear()}`;

        if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, orders: 0, discounts: 0 };
        revenueByPeriod[key].revenue += Number(order.total_amount);
        revenueByPeriod[key].orders += 1;
        revenueByPeriod[key].discounts += Number(order.discount_amount || 0);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalRevenue = orders?.reduce((s: number, o: any) => s + Number(o.total_amount), 0) || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalDiscounts = orders?.reduce((s: number, o: any) => s + Number(o.discount_amount || 0), 0) || 0;
      const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0;

      data = {
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalDiscounts,
        avgOrderValue,
        revenueByPeriod: Object.entries(revenueByPeriod).map(([period, vals]) => ({
          period,
          ...vals,
        })),
      };
    }

    if (report === "overview" || report === "products") {
      // Top/lowest selling products
      const itemsRes = await fetch(
        `${supabaseUrl}/rest/v1/order_items?select=product_id,product_name_ar,product_name_en,quantity,total_price,unit_price&${dateFilter ? dateFilter + "&" : ""}order=quantity.desc`,
        { headers }
      );
      const items = await itemsRes.json();

      const productMap: Record<string, { name_ar: string; name_en: string; quantity: number; revenue: number }> = {};
      for (const item of items || []) {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name_ar: item.product_name_ar, name_en: item.product_name_en, quantity: 0, revenue: 0 };
        }
        productMap[item.product_id].quantity += Number(item.quantity);
        productMap[item.product_id].revenue += Number(item.total_price);
      }

      const productSales = Object.entries(productMap).map(([id, vals]) => ({ id, ...vals }));
      productSales.sort((a, b) => b.quantity - a.quantity);

      data.topProducts = productSales.slice(0, 10);
      data.lowestProducts = productSales.slice(-10).reverse();
      data.totalProductsSold = productSales.reduce((s, p) => s + p.quantity, 0);
      data.productRevenue = productSales.reduce((s, p) => s + p.revenue, 0);
    }

    if (report === "overview" || report === "customers") {
      // Customer growth
      const usersRes = await fetch(
        `${supabaseUrl}/rest/v1/users?select=created_at,is_admin&${dateFilter ? dateFilter + "&" : ""}order=created_at.asc`,
        { headers }
      );
      const users = await usersRes.json();

      const customerGrowth: Record<string, number> = {};
      for (const u of users || []) {
        if (u.is_admin) continue;
        const d = new Date(u.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        customerGrowth[key] = (customerGrowth[key] || 0) + 1;
      }

      // Customers with orders
      const customersWithOrdersRes = await fetch(
        `${supabaseUrl}/rest/v1/orders?select=user_id&${dateFilter ? dateFilter : ""}`,
        { headers }
      );
      const customersWithOrders = await customersWithOrdersRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueCustomers = new Set(customersWithOrders?.map((o: any) => o.user_id)).size;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.totalCustomers = (users || []).filter((u: any) => !u.is_admin).length;
      data.customerGrowth = Object.entries(customerGrowth).map(([period, count]) => ({ period, count }));
      data.uniqueBuyingCustomers = uniqueCustomers;
    }

    if (report === "overview" || report === "orders") {
      // Order growth by status
      const ordersAllRes = await fetch(
        `${supabaseUrl}/rest/v1/orders?select=created_at,status,total_amount&${dateFilter ? dateFilter + "&" : ""}order=created_at.asc`,
        { headers }
      );
      const ordersAll = await ordersAllRes.json();

      const ordersByStatus: Record<string, number> = { new: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
      const orderGrowth: Record<string, number> = {};

      for (const o of ordersAll || []) {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        orderGrowth[key] = (orderGrowth[key] || 0) + 1;
      }

      // Conversion: total visitors vs registered users vs customers with orders
      data.ordersByStatus = ordersByStatus;
      data.orderGrowth = Object.entries(orderGrowth).map(([period, count]) => ({ period, count }));
      data.conversionMetrics = {
        totalUsers: data.totalCustomers || 0,
        buyingUsers: data.uniqueBuyingCustomers || 0,
        conversionRate: data.totalCustomers ? ((data.uniqueBuyingCustomers || 0) / data.totalCustomers * 100).toFixed(1) : "0",
      };
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
