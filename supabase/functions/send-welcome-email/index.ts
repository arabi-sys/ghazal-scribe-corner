import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bookstore <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Our Bookstore! 📚",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Our Bookstore!</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #18181b; margin: 0 0 20px 0;">Hello ${fullName}! 👋</h2>
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for joining our bookstore community! We're thrilled to have you with us.
                </p>
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Here's what you can do now:
                </p>
                <ul style="color: #52525b; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                  <li>📖 Browse our extensive collection of books</li>
                  <li>📱 Read ebooks directly in your browser</li>
                  <li>💳 Make secure purchases</li>
                  <li>🔄 Exchange books with other readers</li>
                  <li>❤️ Create your personalized wishlist</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SITE_URL') || 'https://your-bookstore.lovable.app'}" 
                     style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Start Exploring
                  </a>
                </div>
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                  Happy reading! 📚
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

    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
