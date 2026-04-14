import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async () => {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 55_000;
  const MIN_REMAINING_MS = 5_000;

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create bot state
    const { data: state } = await supabase
      .from('telegram_link_codes')
      .select('id')
      .limit(1);

    // We'll use a simple approach: just call getUpdates once with a short timeout
    // to process any pending link codes
    let offset = 0;
    
    // Try to read stored offset from a simple key-value approach
    // For simplicity, we'll just process recent updates
    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset,
        timeout: 5,
        allowed_updates: ['message'],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram getUpdates failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    const updates = data.result ?? [];
    let processed = 0;

    for (const update of updates) {
      const message = update.message;
      if (!message?.text) continue;

      const text = message.text.trim().toUpperCase();
      const chatId = message.chat.id;

      // Check if this is a link code
      if (text.startsWith('/START ') || text.length === 6) {
        const code = text.startsWith('/START ') ? text.slice(7) : text;

        // Look up the code
        const { data: linkCode } = await supabase
          .from('telegram_link_codes')
          .select('*')
          .eq('code', code)
          .eq('used', false)
          .gte('expires_at', new Date().toISOString())
          .single();

        if (linkCode) {
          // Mark code as used
          await supabase
            .from('telegram_link_codes')
            .update({ used: true })
            .eq('id', linkCode.id);

          // Update profile with telegram_chat_id
          await supabase
            .from('profiles')
            .update({ telegram_chat_id: String(chatId) })
            .eq('user_id', linkCode.user_id);

          // Send confirmation message
          await fetch(`${GATEWAY_URL}/sendMessage`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': TELEGRAM_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: '✅ Your Telegram account has been linked to Party Panther! You\'ll now receive notifications here when there\'s activity on your events and promos.',
              parse_mode: 'HTML',
            }),
          });

          processed++;
        } else {
          // Invalid or expired code
          await fetch(`${GATEWAY_URL}/sendMessage`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': TELEGRAM_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: '❌ Invalid or expired link code. Please generate a new code from your Party Panther profile.',
              parse_mode: 'HTML',
            }),
          });
        }
      } else if (text === '/START') {
        await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🐆 Welcome to Party Panther Bot!\n\nTo link your account, go to your profile on Party Panther and click "Link Telegram". You\'ll get a 6-character code to send here.',
            parse_mode: 'HTML',
          }),
        });
      }
    }

    // Acknowledge updates to avoid processing them again
    if (updates.length > 0) {
      const maxUpdateId = Math.max(...updates.map((u: any) => u.update_id));
      await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offset: maxUpdateId + 1, timeout: 0 }),
      });
    }

    return new Response(JSON.stringify({ ok: true, processed, updates: updates.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Telegram poll error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
