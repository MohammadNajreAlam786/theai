import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bodyText = await req.text();
    const callbackData = JSON.parse(bodyText);
    
    console.log('Suno callback hit:', { method: req.method, path: url.pathname, body: bodyText });

    // Initialize Supabase with service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (callbackData.code === 200 && callbackData.data) {
      const taskId = callbackData.data.task_id;
      const callbackType = callbackData.data.callbackType;
      const songs = callbackData.data.data;

      if (callbackType === 'complete' && songs && songs.length > 0) {
        // Get first complete song with audio
        const completeSong = songs.find((song: any) => song.audio_url);
        
        if (completeSong) {
          // Download and convert to base64
          const audioResponse = await fetch(completeSong.audio_url);
          const audioBlob = await audioResponse.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
          const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

          // Update task in database
          const { error: updateError } = await supabase
            .from('music_tasks')
            .update({
              status: 'complete',
              audio_url: dataUrl,
              title: completeSong.title || 'Untitled',
              updated_at: new Date().toISOString()
            })
            .eq('task_id', taskId);

          if (updateError) {
            console.error('Error updating task:', updateError);
          } else {
            console.log('Task updated successfully:', taskId);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Suno callback error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
