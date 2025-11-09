import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();
    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY is not configured');
    }

    console.log('Checking music status for task:', taskId);

    const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/query?taskIds=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Suno API status check error:', statusResponse.status, errorText);
      throw new Error(`Failed to check status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('Status response:', JSON.stringify(statusData));

    if (statusData.code !== 200) {
      throw new Error(`Suno API error: ${statusData.msg || 'Unknown error'}`);
    }

    // Extract first complete song
    const songs = Array.isArray(statusData.data) ? statusData.data : [statusData.data];
    const completeSong = songs.find((song: any) => song.audio_url && song.audio_url.length > 0);

    if (completeSong) {
      // Download and convert to base64
      const audioResponse = await fetch(completeSong.audio_url);
      const audioBlob = await audioResponse.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
      
      return new Response(
        JSON.stringify({ 
          status: 'complete',
          audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
          title: completeSong.title || 'Untitled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any failed
    const failedSong = songs.find((song: any) => song.status === 'error' || song.status === 'failed');
    if (failedSong) {
      throw new Error(`Music generation failed: ${failedSong.error_message || 'Unknown error'}`);
    }

    // Still processing
    return new Response(
      JSON.stringify({ status: 'processing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error checking music status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
