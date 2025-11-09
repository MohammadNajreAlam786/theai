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
        model: 'V3_5',
        callBackUrl: 'https://evjdmanjcqwvuymrnded.functions.supabase.co/suno-callback'
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Suno API create error:', createResponse.status, errorText);
      throw new Error(`Suno API create error: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    console.log('Suno API response:', JSON.stringify(createData));
    
    if (createData.code !== 200) {
      console.error('Suno API returned non-200 code:', createData);
      throw new Error(`Suno API error: ${createData.msg || 'Unknown error'}`);
    }
    
    if (!createData.data?.taskId) {
      console.error('No task ID in response. Full response:', JSON.stringify(createData));
      throw new Error(`No task ID returned from Suno API. Response: ${JSON.stringify(createData)}`);
    }

    const taskId = createData.data.taskId;
    console.log('Music generation started with task ID:', taskId);

    // Return task ID immediately - Suno will callback when ready
    // The callback-based approach is more reliable than polling

    return new Response(
      JSON.stringify({ 
        taskId,
        message: 'Music generation started. This will take 60-120 seconds. Please check back shortly.'
      }),
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
