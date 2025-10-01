import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt, duration = "short" } = await req.json();
    console.log('Generating music with prompt:', prompt);

    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY is not configured');
    }

    // Submit generation request to Suno
    const generateResponse = await fetch('https://api.suno.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration, // "short" (30s) or "long" (2min)
        make_instrumental: false,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Suno API error:', errorText);
      throw new Error(`Suno API error: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    const jobId = generateData.id;
    console.log('Generation started, job ID:', jobId);

    // Poll for completion (max 60 seconds)
    let audioUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !audioUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const statusResponse = await fetch(`https://api.suno.ai/v1/generate/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to check status');
        break;
      }

      const statusData = await statusResponse.json();
      console.log(`Status check ${attempts + 1}:`, statusData.status);

      if (statusData.status === 'complete') {
        audioUrl = statusData.audio_url;
        console.log('Music generation complete');
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('Music generation failed');
      }

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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
