import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User authentication failed');
    }

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

    // Store task in database
    const { error: dbError } = await supabase
      .from('music_tasks')
      .insert({
        task_id: taskId,
        user_id: user.id,
        prompt: prompt,
        status: 'pending'
      });
    
    if (dbError) {
      console.error('Error storing task:', dbError);
      throw new Error('Failed to store music generation task');
    }

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
