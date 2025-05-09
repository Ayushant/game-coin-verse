
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
    const { withdrawalId, status } = await req.json();

    if (!withdrawalId || !status) {
      return new Response(
        JSON.stringify({ error: "Withdrawal ID and status are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate status
    if (status !== 'completed' && status !== 'failed') {
      return new Response(
        JSON.stringify({ error: "Status must be 'completed' or 'failed'" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Get withdrawal details
    const { data: withdrawalData, error: withdrawalError } = await supabaseClient
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (withdrawalError) {
      console.error("Error fetching withdrawal:", withdrawalError);
      throw withdrawalError;
    }

    console.log("Processing withdrawal:", withdrawalId, "Current status:", withdrawalData.status);

    // 2. Update withdrawal status
    const { error: updateError } = await supabaseClient
      .from("withdrawals")
      .update({
        status: status,
        processed_at: new Date().toISOString()
      })
      .eq("id", withdrawalId);

    if (updateError) {
      console.error("Error updating withdrawal status:", updateError);
      throw updateError;
    }

    console.log("Updated withdrawal status to:", status);

    // 3. If rejection, refund the coins to user
    if (status === 'failed') {
      // Get user's current coins
      const { data: userData, error: userError } = await supabaseClient
        .from("profiles")
        .select("coins")
        .eq("id", withdrawalData.user_id)
        .single();
      
      if (userError) {
        console.error("Error fetching user data for refund:", userError);
        throw userError;
      }

      // Update user's coins (refund)
      const { error: refundError } = await supabaseClient
        .from("profiles")
        .update({
          coins: userData.coins + withdrawalData.coins_spent
        })
        .eq("id", withdrawalData.user_id);
      
      if (refundError) {
        console.error("Error refunding coins:", refundError);
        throw refundError;
      }
      
      console.log("Refunded", withdrawalData.coins_spent, "coins to user", withdrawalData.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
