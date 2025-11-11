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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!RUNWAY_API_KEY) {
      throw new Error('RUNWAY_API_KEY is not configured');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Step 1: Generating image from prompt:', prompt);

    // Step 1: Generate an image from the text prompt using Lovable AI
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a high-quality image for this video prompt: ${prompt}`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Lovable AI image generation error:', imageResponse.status, errorText);
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated from AI');
    }

    console.log('Step 2: Creating video from generated image');

    // Step 2: Create video generation task using the generated image
    const createResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptText: prompt,
        promptImage: imageUrl,
        model: 'gen3a_turbo',
        duration: 5,
        ratio: '1280:768'
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Runway API create error:', createResponse.status, errorText);
      throw new Error(`Failed to create video generation: ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    console.log('Video generation started with task ID:', taskId);

    // Step 3: Poll for video completion
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 120; // 20 minutes max

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds

      const statusResponse = await fetch(
        `https://api.dev.runwayml.com/v1/tasks/${taskId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06',
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
      console.log('Task status:', statusData.status);

      if (statusData.status === 'SUCCEEDED') {
        // The output should be a video URL from Runway
        if (statusData.output && statusData.output.length > 0) {
          const runwayVideoUrl = statusData.output[0];
          console.log('Downloading video from:', runwayVideoUrl);
          
          // Download the video file and convert to base64
          const videoResponse = await fetch(runwayVideoUrl);
          const videoBlob = await videoResponse.arrayBuffer();
          const base64Video = btoa(String.fromCharCode(...new Uint8Array(videoBlob)));
          videoUrl = `data:video/mp4;base64,${base64Video}`;
          console.log('Video generated successfully');
          break;
        } else {
          throw new Error('Video generation succeeded but no output URL provided');
        }
      } else if (statusData.status === 'FAILED') {
        throw new Error(`Video generation failed: ${statusData.failure?.message || 'Unknown error'}`);
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