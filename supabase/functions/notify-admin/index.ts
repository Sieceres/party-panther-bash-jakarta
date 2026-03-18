import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const APP_BASE_URL = 'https://party-panther-bash-jakarta.lovable.app';

const EMOJI_MAP: Record<string, string> = {
  new_report: '🚨',
  new_user: '👤',
  new_promo: '🎉',
  new_event: '📅',
  new_venue: '📍',
  new_venue_claim: '🏢',
  new_review: '⭐',
  new_venue_edit: '✏️',
  user_flagged: '⚠️',
};

const LABEL_MAP: Record<string, string> = {
  new_report: 'New Report',
  new_user: 'New User Signed Up',
  new_promo: 'New Promo Created',
  new_event: 'New Event Created',
  new_venue: 'New Venue Added',
  new_venue_claim: 'New Venue Claim',
  new_review: 'New Review',
  new_venue_edit: 'Venue Edit Suggestion',
  user_flagged: 'User Flagged',
};

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, title, details, link } = await req.json();

    if (!type) {
      return new Response(JSON.stringify({ success: false, error: 'type is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this notification type is enabled
    const { data: setting } = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('notification_type', type)
      .single();

    if (setting && !setting.enabled) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emoji = EMOJI_MAP[type] || '📢';
    const label = LABEL_MAP[type] || type;

    const lines = [
      `${emoji} <b>${label}</b>`,
      '',
    ];

    if (title) lines.push(`<b>Title:</b> ${title}`);
    if (details) {
      if (typeof details === 'string') {
        lines.push(details);
      } else {
        for (const [key, value] of Object.entries(details)) {
          if (value) lines.push(`<b>${key}:</b> ${value}`);
        }
      }
    }
    if (link) {
      const fullLink = link.startsWith('http') ? link : `${APP_BASE_URL}${link}`;
      lines.push(`\n<b>Link:</b> <a href="${fullLink}">${fullLink}</a>`);
    }

    const message = lines.filter(Boolean).join('\n');

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
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
