import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY');

    if (!RUNWAY_API_KEY) {
      throw new Error('RUNWAY_API_KEY is not configured');
    }

    console.log('Generating video with Runway API:', prompt);

    // Step 1: Create video generation task
    const createResponse = await fetch('https://api.dev.runwayml.com/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'gen3',
        duration: 5,
        ratio: '16:9'
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Runway API create error:', createResponse.status, errorText);
      throw new Error(`Failed to create video generation: ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    console.log('Video generation started:', taskId);

    // Step 2: Poll for video completion
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 120; // 20 minutes max

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds

      const statusResponse = await fetch(
        `https://api.dev.runwayml.com/v1/generations/${taskId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Runway API status check error:', errorText);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'SUCCEEDED' && statusData.output) {
        // Download the video file
        const videoResponse = await fetch(statusData.output[0]);
        const videoBlob = await videoResponse.arrayBuffer();
        const base64Video = btoa(String.fromCharCode(...new Uint8Array(videoBlob)));
        videoUrl = `data:video/mp4;base64,${base64Video}`;
        console.log('Video generated successfully');
        break;
      } else if (statusData.status === 'FAILED') {
        throw new Error('Video generation failed');
      }

      console.log('Video still processing...');
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    console.log('Video generation complete');

    return new Response(
      JSON.stringify({ videoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});