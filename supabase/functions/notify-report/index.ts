import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const APP_BASE_URL = 'https://party-panther-bash-jakarta.lovable.app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
    if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_ADMIN_CHAT_ID is not configured');

    const { reason, target_type, target_id, target_title, description, reporter_email } = await req.json();

    // Build a link to the reported content
    let targetLink = '';
    if (target_type === 'promo' && target_id) {
      targetLink = `\n<b>Link:</b> <a href="${APP_BASE_URL}/promos/${target_id}">${APP_BASE_URL}/promos/${target_id}</a>`;
    } else if (target_type === 'event' && target_id) {
      targetLink = `\n<b>Link:</b> <a href="${APP_BASE_URL}/events/${target_id}">${APP_BASE_URL}/events/${target_id}</a>`;
    } else if (target_type === 'profile' && target_id) {
      targetLink = `\n<b>Link:</b> <a href="${APP_BASE_URL}/profile/${target_id}">${APP_BASE_URL}/profile/${target_id}</a>`;
    }

    const message = [
      `🚨 <b>New Report</b>`,
      ``,
      `<b>Type:</b> ${target_type}`,
      `<b>Target:</b> ${target_title || 'Unknown'}`,
      `<b>Reason:</b> ${reason}`,
      description ? `<b>Details:</b> ${description}` : '',
      `<b>Reported by:</b> ${reporter_email || 'Unknown'}`,
      targetLink,
      ``,
      `Check the admin dashboard to review.`,
    ].filter(Boolean).join('\n');

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API call failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending Telegram notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
