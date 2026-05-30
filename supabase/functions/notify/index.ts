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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const body = await req.json();
    const { type, order_id, user_id } = body;

    if (type === "new_order" && order_id) {
      // Get order details
      const orderRes = await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${order_id}&select=*,user:users(full_name)`,
        { headers }
      );
      const orders = await orderRes.json();
      const order = orders?.[0];
      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get all admin users
      const adminsRes = await fetch(
        `${supabaseUrl}/rest/v1/users?is_admin=eq.true&select=id`,
        { headers }
      );
      const admins = await adminsRes.json();

      // Create notification for each admin
      const notifications = (admins || []).map((admin: { id: string }) => ({
        user_id: admin.id,
        title_ar: "طلب جديد",
        title_en: "New Order",
        message_ar: `طلب جديد #${order_id.slice(0, 8)} من ${(order.user as { full_name?: string })?.full_name || "عميل"} بقيمة ${order.total_amount} ج.م`,
        message_en: `New order #${order_id.slice(0, 8)} from ${(order.user as { full_name?: string })?.full_name || "customer"} for ${order.total_amount} EGP`,
        type: "order",
        is_read: false,
        link: "/admin/orders",
      }));

      if (notifications.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify(notifications),
        });
      }

      // Also notify the customer
      if (user_id) {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify([{
            user_id,
            title_ar: "تم استلام طلبك",
            title_en: "Order Received",
            message_ar: `تم استلام طلبك #${order_id.slice(0, 8)} بنجاح وسيتم معالجته قريباً`,
            message_en: `Your order #${order_id.slice(0, 8)} has been received and will be processed soon`,
            type: "order",
            is_read: false,
            link: "/orders",
          }]),
        });
      }

      return new Response(JSON.stringify({ success: true, notified: notifications.length + (user_id ? 1 : 0) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "order_status" && order_id && user_id) {
      // Get updated order
      const orderRes = await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${order_id}&select=status`,
        { headers }
      );
      const orders = await orderRes.json();
      const order = orders?.[0];
      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusMessages: Record<string, { ar: string; en: string }> = {
        processing: { ar: "طلبك قيد المعالجة", en: "Your order is being processed" },
        shipped: { ar: "تم شحن طلبك", en: "Your order has been shipped" },
        delivered: { ar: "تم توصيل طلبك", en: "Your order has been delivered" },
        cancelled: { ar: "تم إلغاء طلبك", en: "Your order has been cancelled" },
      };

      const msg = statusMessages[order.status];
      if (msg) {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify([{
            user_id,
            title_ar: `تحديث الطلب #${order_id.slice(0, 8)}`,
            title_en: `Order Update #${order_id.slice(0, 8)}`,
            message_ar: msg.ar,
            message_en: msg.en,
            type: "order",
            is_read: false,
            link: "/orders",
          }]),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
