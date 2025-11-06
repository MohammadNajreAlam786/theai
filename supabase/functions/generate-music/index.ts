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
    const createResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        customMode: false,
        instrumental: false,
        model: 'V3_5'
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Suno API create error:', createResponse.status, errorText);
      throw new Error(`Suno API create error: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    
    if (createData.code !== 200 || !createData.data?.taskId) {
      console.error('Invalid Suno API response:', createData);
      throw new Error('No task ID returned from Suno API');
    }

    const taskId = createData.data.taskId;
    console.log('Music generation started with task ID:', taskId);

    // Step 2: Poll for completion
    let audioUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 40; // 200 seconds max (first track ready in 30-40s)

    while (!audioUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds

      const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/query?taskId=${taskId}`, {
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
      
      if (statusData.code === 200 && statusData.data) {
        const songs = Array.isArray(statusData.data) ? statusData.data : [statusData.data];
        const completeSong = songs.find((song: any) => song.status === 'complete' && song.audio_url);
        
        if (completeSong) {
          // Download the audio file
          const audioResponse = await fetch(completeSong.audio_url);
          const audioBlob = await audioResponse.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
          console.log('Music generated successfully');
          break;
        }
        
        const failedSong = songs.find((song: any) => song.status === 'error' || song.status === 'failed');
        if (failedSong) {
          throw new Error(`Music generation failed: ${failedSong.error_message || 'Unknown error'}`);
        }
      }

      console.log(`Music still generating... (attempt ${attempts + 1}/${maxAttempts})`);
      attempts++;
    }

    if (!audioUrl) {
      throw new Error('Music generation timed out after 200 seconds');
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
