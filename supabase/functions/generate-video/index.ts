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
    const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY');

    if (!STABILITY_API_KEY) {
      throw new Error('STABILITY_API_KEY is not configured');
    }

    console.log('Generating video with Stability AI:', prompt);

    // Step 1: Generate an image from the prompt using Stability AI
    const imageResponse = await fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Accept': 'application/json',
        },
        body: (() => {
          const formData = new FormData();
          formData.append('prompt', prompt);
          formData.append('output_format', 'png');
          formData.append('aspect_ratio', '16:9');
          return formData;
        })(),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Stability AI image generation error:', errorText);
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const imageBase64 = imageData.image;
    console.log('Image generated successfully');

    // Step 2: Generate video from the image using Stability AI Video
    const videoResponse = await fetch(
      'https://api.stability.ai/v2beta/image-to-video',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
        },
        body: (() => {
          const formData = new FormData();
          // Convert base64 to blob
          const binaryString = atob(imageBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/png' });
          formData.append('image', blob, 'image.png');
          formData.append('seed', '0');
          formData.append('cfg_scale', '1.8');
          formData.append('motion_bucket_id', '127');
          return formData;
        })(),
      }
    );

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('Stability AI video generation error:', errorText);
      throw new Error(`Failed to generate video: ${errorText}`);
    }

    const videoData = await videoResponse.json();
    const generationId = videoData.id;
    console.log('Video generation started:', generationId);

    // Poll for video completion
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 120;

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds

      const resultResponse = await fetch(
        `https://api.stability.ai/v2beta/image-to-video/result/${generationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'video/*',
          },
        }
      );

      if (resultResponse.status === 202) {
        console.log('Video still processing...');
        attempts++;
        continue;
      }

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error('Stability AI result fetch error:', errorText);
        throw new Error(`Failed to fetch video result: ${errorText}`);
      }

      // Video is ready, convert to base64
      const videoBlob = await resultResponse.arrayBuffer();
      const base64Video = btoa(String.fromCharCode(...new Uint8Array(videoBlob)));
      videoUrl = `data:video/mp4;base64,${base64Video}`;
      console.log('Video generated successfully');
      break;
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