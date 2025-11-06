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
    const { prompt } = await req.json();
    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY is not configured');
    }

    console.log('Generating music with Suno AI:', prompt);

    // Step 1: Create music generation request
    const createResponse = await fetch('https://api.suno.ai/v1/music/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        make_instrumental: false,
        wait_audio: false
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Suno API create error:', createResponse.status, errorText);
      throw new Error(`Suno API create error: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    const songId = createData.id || createData[0]?.id;
    
    if (!songId) {
      throw new Error('No song ID returned from Suno API');
    }

    console.log('Music generation started:', songId);

    // Step 2: Poll for completion
    let audioUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (!audioUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds

      const statusResponse = await fetch(`https://api.suno.ai/v1/music/${songId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Suno API status check error:', statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'complete' && statusData.audio_url) {
        // Download the audio file
        const audioResponse = await fetch(statusData.audio_url);
        const audioBlob = await audioResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        console.log('Music generated successfully');
        break;
      } else if (statusData.status === 'error' || statusData.status === 'failed') {
        throw new Error('Music generation failed');
      }

      console.log('Music still generating...');
      attempts++;
    }

    if (!audioUrl) {
      throw new Error('Music generation timed out');
    }

    return new Response(
      JSON.stringify({ audioUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-music function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
