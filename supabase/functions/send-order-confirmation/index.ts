import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  email: string;
  fullName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, orderId, items, total, shippingAddress }: OrderConfirmationRequest = await req.json();

    console.log(`Sending order confirmation email to ${email} for order ${orderId}`);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
          <span style="color: #18181b; font-weight: 500;">${item.name}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: center; color: #52525b;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: right; color: #18181b; font-weight: 500;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bookstore <onboarding@resend.dev>",
        to: [email],
        subject: `Order Confirmed! #${orderId.slice(0, 8)} 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmed!</h1>
              </div>
              <div style="padding: 40px 30px;">
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Hi ${fullName},
                </p>
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Great news! Your order has been confirmed and is being processed. Here are the details:
                </p>
                
                <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                  <p style="margin: 0; color: #71717a; font-size: 14px;">Order Number</p>
                  <p style="margin: 5px 0 0 0; color: #18181b; font-size: 18px; font-weight: 600;">#${orderId.slice(0, 8).toUpperCase()}</p>
                </div>

                <h3 style="color: #18181b; margin: 0 0 15px 0; font-size: 16px;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr style="background-color: #f4f4f5;">
                      <th style="padding: 12px; text-align: left; color: #71717a; font-weight: 500; font-size: 14px;">Item</th>
                      <th style="padding: 12px; text-align: center; color: #71717a; font-weight: 500; font-size: 14px;">Qty</th>
                      <th style="padding: 12px; text-align: right; color: #71717a; font-weight: 500; font-size: 14px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 15px 12px; text-align: right; color: #18181b; font-weight: 600; font-size: 16px;">Total</td>
                      <td style="padding: 15px 12px; text-align: right; color: #16a34a; font-weight: 700; font-size: 18px;">$${total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                <h3 style="color: #18181b; margin: 30px 0 15px 0; font-size: 16px;">Shipping Address</h3>
                <div style="background-color: #f4f4f5; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6; white-space: pre-line;">${shippingAddress}</p>
                </div>

                <div style="text-align: center; margin: 40px 0 20px 0;">
                  <a href="${Deno.env.get('SITE_URL') || 'https://your-bookstore.lovable.app'}/orders" 
                     style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Order Details
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                  Thank you for shopping with us! 📚
                </p>
              </div>
              <div style="background-color: #f4f4f5; padding: 20px 30px; text-align: center;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Bookstore. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Order confirmation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
