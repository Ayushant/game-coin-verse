
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get the current client's authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Extract JWT token
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized request" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Only handle POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Parse request body
    const { withdrawalId } = await req.json();
    
    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ error: "Missing withdrawal ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabaseClient
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .eq("status", "pending")
      .single();
    
    if (fetchError || !withdrawal) {
      return new Response(
        JSON.stringify({ error: "Withdrawal not found or already processed" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Verify user owns this withdrawal
    if (withdrawal.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to withdrawal" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In a production system, you would call the payout API here
    // For example with Razorpay Payouts or Cashfree Payouts
    
    // This is where you would make the actual API call to Razorpay/Cashfree
    // For this example, we'll simulate a successful payout
    const payoutSuccessful = true;
    const payoutData = {
      id: `payout_${Math.random().toString(36).substring(2, 15)}`,
      amount: withdrawal.amount,
      upi_id: withdrawal.payment_detail, // Updated from upi_id to payment_detail
      status: "processed",
      transaction_id: `txn_${Math.random().toString(36).substring(2, 15)}`,
    };
    
    // Update withdrawal status based on payout result
    const status = payoutSuccessful ? "completed" : "failed";
    const processed_at = new Date().toISOString();
    
    const { error: updateError } = await supabaseClient
      .from("withdrawals")
      .update({ 
        status,
        processed_at,
      })
      .eq("id", withdrawalId);
      
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update withdrawal status", details: updateError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        status,
        payout: payoutData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
