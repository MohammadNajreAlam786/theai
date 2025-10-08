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

    console.log('Generating video with prompt:', prompt);

    // Create video generation task
    const createResponse = await fetch('https://api.dev.runwayml.com/v1/video_generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration: 5,
        aspect_ratio: "16:9"
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Runway API error:', errorText);
      throw new Error(`Failed to create video: ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    console.log('Video generation task created:', taskId);

    // Poll for completion
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/video_generations/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check video status');
      }

      const statusData = await statusResponse.json();
      console.log('Video status:', statusData.status);

      if (statusData.status === 'succeeded' && statusData.output) {
        videoUrl = statusData.output[0];
      } else if (statusData.status === 'failed') {
        throw new Error('Video generation failed');
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    console.log('Video generated successfully:', videoUrl);

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