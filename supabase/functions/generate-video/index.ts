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

    // Step 1: Generate an image from the prompt (text_to_image)
    const ratio = "1280:720"; // Use resolution-style ratio per 2024-11-06 API version

    const imageCreateResponse = await fetch('https://api.dev.runwayml.com/v1/text_to_image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_image',
        prompt_text: prompt,
        ratio,
      }),
    });

    if (!imageCreateResponse.ok) {
      const errorText = await imageCreateResponse.text();
      console.error('Runway API (text_to_image) error:', errorText);
      throw new Error(`Failed to create image: ${errorText}`);
    }

    const imageCreateData = await imageCreateResponse.json();
    const imageTaskId = imageCreateData.id;
    console.log('Image generation task created:', imageTaskId);

    // Poll for image completion via tasks endpoint
    let imageUrl: string | null = null;
    {
      let attempts = 0;
      const maxAttempts = 60;
      while (!imageUrl && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const imgStatusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${imageTaskId}`, {
          headers: {
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06',
          },
        });

        if (!imgStatusResponse.ok) {
          throw new Error('Failed to check image task status');
        }

        const imgStatusData = await imgStatusResponse.json();
        console.log('Image task status:', imgStatusData.status);

        const status = (imgStatusData.status || '').toString().toUpperCase();
        if (status === 'SUCCEEDED' && imgStatusData.output) {
          // output could be an array of URLs or array of objects
          const first = imgStatusData.output[0];
          imageUrl = typeof first === 'string' ? first : (first?.url || first?.imageURL || null);
        } else if (status === 'FAILED') {
          throw new Error('Image generation failed');
        }

        attempts++;
      }

      if (!imageUrl) {
        throw new Error('Image generation timed out');
      }
    }

    console.log('Image generated successfully:', imageUrl);

    // Step 2: Generate a video from the image (image_to_video)
    const videoCreateResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_turbo',
        prompt_image: imageUrl,
        prompt_text: prompt,
        ratio,
      }),
    });

    if (!videoCreateResponse.ok) {
      const errorText = await videoCreateResponse.text();
      console.error('Runway API (image_to_video) error:', errorText);
      throw new Error(`Failed to create video task: ${errorText}`);
    }

    const videoCreateData = await videoCreateResponse.json();
    const videoTaskId = videoCreateData.id;
    console.log('Video generation task created:', videoTaskId);

    // Poll for video completion via tasks endpoint
    let videoUrl: string | null = null;
    {
      let attempts = 0;
      const maxAttempts = 60;
      while (!videoUrl && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const vidStatusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${videoTaskId}`, {
          headers: {
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06',
          },
        });

        if (!vidStatusResponse.ok) {
          throw new Error('Failed to check video task status');
        }

        const vidStatusData = await vidStatusResponse.json();
        console.log('Video task status:', vidStatusData.status);

        const status = (vidStatusData.status || '').toString().toUpperCase();
        if (status === 'SUCCEEDED' && vidStatusData.output) {
          const first = vidStatusData.output[0];
          videoUrl = typeof first === 'string' ? first : (first?.url || first?.videoURL || null);
        } else if (status === 'FAILED') {
          throw new Error('Video generation failed');
        }

        attempts++;
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out');
      }
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