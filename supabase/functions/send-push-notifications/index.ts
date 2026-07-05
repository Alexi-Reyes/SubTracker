import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()
    const inFiveMinutes = new Date(Date.now() + 5 * 60000).toISOString()

    const { data: trackers, error } = await supabaseClient
      .from('trackers')
      .select('*')
      .gte('notify_datetime', fiveMinutesAgo)
      .lte('notify_datetime', inFiveMinutes)

    if (error) throw error;
    if (!trackers || trackers.length === 0) {
      return new Response(JSON.stringify({ message: "No notifications to send" }), { status: 200 })
    }

    const { data: tokens } = await supabaseClient
      .from("push_tokens")
      .select("user_id, token");

    const messages = [];

    for (const { user_id, token } of tokens ?? []) {
      const userTrackers = trackers.filter(t => t.user_id === user_id);

      if (userTrackers.length === 0) continue; 

      const count = userTrackers.length;
      const body = count > 1 
        ? `${count} abonnements nécessitent votre attention !`
        : `L'abonnement ${userTrackers[0].name} (${userTrackers[0].price} ${userTrackers[0].currency}) arrive à échéance !`;

      messages.push({ 
        to: token, 
        title: "SubTracker", 
        body: body,
        data: { trackerId: userTrackers[0].id }
      });
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found for these users" }), { status: 200 })
    }

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { 
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(messages),
    });

    const expoData = await expoRes.json();

    return new Response(JSON.stringify({ success: true, sent: messages.length, expoData }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
