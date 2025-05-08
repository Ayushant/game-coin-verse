
// Follow this setup guide to integrate the Deno runtime and the Supabase
// JavaScript SDK with your Supabase project: https://deno.land/guides/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const { paymentId } = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Get payment details
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("manual_payments")
      .select("*, paid_apps(*)")
      .eq("id", paymentId)
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // 2. Update payment status
    const { error: updateError } = await supabaseClient
      .from("manual_payments")
      .update({
        status: "approved",
        verified_at: new Date().toISOString(),
        verified_by: "admin"
      })
      .eq("id", paymentId);

    if (updateError) {
      throw updateError;
    }

    // 3. Create a purchase record
    const { error: purchaseError } = await supabaseClient
      .from("purchases")
      .insert({
        user_id: paymentData.user_id,
        app_id: paymentData.app_id,
        payment_type: "manual"
      });

    if (purchaseError) {
      throw purchaseError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payment approved successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing manual payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
