// RIPS LAB — Phase 3 scaffold: server-authoritative pack open
// Deploy with: supabase functions deploy open-pack
// This is a foundation stub. Wire it to the real tables and rate limits before production use.
// IMPORTANT: Never expose the service role key to the browser.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const packId = typeof body.packId === 'string' ? body.packId : null;
    if (!packId) {
      return new Response(JSON.stringify({ error: 'packId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO Phase 3:
    // 1. Load pack from pack_catalog (or trusted config)
    // 2. Load user_collections with row lock / optimistic version
    // 3. Check demo_balance >= pack.price
    // 4. Roll rarity + token server-side
    // 5. Update balance + append items/activity
    // 6. Apply rate limit (e.g. max opens per minute)
    // 7. Return the new Rip

    return new Response(
      JSON.stringify({
        ok: false,
        message:
          'open-pack Edge Function scaffold is deployed but not yet wired to the collection tables. Keep using the client demo path until Phase 3 is finished.',
        packId,
        userId: user.id,
      }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
