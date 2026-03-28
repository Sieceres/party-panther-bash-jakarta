import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, venue_pin, action } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing voucher code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up voucher
    const { data: voucher, error: vErr } = await supabaseAdmin
      .from("promo_vouchers")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (vErr || !voucher) {
      return new Response(
        JSON.stringify({ error: "Voucher not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up promo
    const { data: promo } = await supabaseAdmin
      .from("promos")
      .select("id, title, venue_name, venue_id, discount_text, promo_type, valid_until, image_url")
      .eq("id", voucher.promo_id)
      .single();

    if (!promo) {
      return new Response(
        JSON.stringify({ error: "Promo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // action=lookup: just return voucher info (for the verification page)
    if (action === "lookup") {
      // Check validity
      const expired = voucher.expires_at && new Date(voucher.expires_at) < new Date();
      const redeemed = voucher.redemption_mode === "single" && voucher.is_redeemed;
      let cooldownActive = false;
      if (voucher.redemption_mode === "multi" && voucher.last_redeemed_at && voucher.cooldown_days) {
        const cooldownEnd = new Date(voucher.last_redeemed_at);
        cooldownEnd.setDate(cooldownEnd.getDate() + voucher.cooldown_days);
        cooldownActive = cooldownEnd > new Date();
      }

      return new Response(
        JSON.stringify({
          voucher: {
            code: voucher.code,
            redemption_mode: voucher.redemption_mode,
            is_redeemed: voucher.is_redeemed,
            redemption_count: voucher.redemption_count,
            last_redeemed_at: voucher.last_redeemed_at,
            cooldown_days: voucher.cooldown_days,
            expires_at: voucher.expires_at,
            created_at: voucher.created_at,
          },
          promo: {
            title: promo.title,
            venue_name: promo.venue_name,
            discount_text: promo.discount_text,
            promo_type: promo.promo_type,
            image_url: promo.image_url,
          },
          status: expired ? "expired" : redeemed ? "redeemed" : cooldownActive ? "cooldown" : "valid",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // action=redeem: verify PIN and redeem
    if (!venue_pin || typeof venue_pin !== "string" || venue_pin.length !== 4) {
      return new Response(
        JSON.stringify({ error: "Invalid PIN. Enter the 4-digit venue PIN." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check voucher validity
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This voucher has expired." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (voucher.redemption_mode === "single" && voucher.is_redeemed) {
      return new Response(
        JSON.stringify({ error: "This voucher has already been redeemed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (voucher.redemption_mode === "multi" && voucher.last_redeemed_at && voucher.cooldown_days) {
      const cooldownEnd = new Date(voucher.last_redeemed_at);
      cooldownEnd.setDate(cooldownEnd.getDate() + voucher.cooldown_days);
      if (cooldownEnd > new Date()) {
        return new Response(
          JSON.stringify({
            error: `Cooldown active. This voucher can be used again after ${cooldownEnd.toLocaleDateString()}.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verify venue PIN
    if (!promo.venue_id) {
      return new Response(
        JSON.stringify({ error: "This promo is not linked to a venue. PIN verification unavailable." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: venuePin } = await supabaseAdmin
      .from("venue_pins")
      .select("pin_hash")
      .eq("venue_id", promo.venue_id)
      .single();

    if (!venuePin) {
      return new Response(
        JSON.stringify({ error: "No PIN set for this venue. The venue owner must set a redemption PIN first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inputHash = await hashPin(venue_pin);
    if (inputHash !== venuePin.pin_hash) {
      return new Response(
        JSON.stringify({ error: "Incorrect PIN. Please try again." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Redeem the voucher
    const updateData: Record<string, unknown> = {
      last_redeemed_at: new Date().toISOString(),
      redemption_count: (voucher.redemption_count || 0) + 1,
    };
    if (voucher.redemption_mode === "single") {
      updateData.is_redeemed = true;
    }

    const { error: updateErr } = await supabaseAdmin
      .from("promo_vouchers")
      .update(updateData)
      .eq("id", voucher.id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Failed to redeem voucher." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Voucher redeemed successfully! 🎉",
        promo_title: promo.title,
        discount: promo.discount_text,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
