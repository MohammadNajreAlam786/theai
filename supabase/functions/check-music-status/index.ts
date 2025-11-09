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
    const { taskId } = await req.json();
    
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

    console.log('Checking music status for task:', taskId);

    // Query our database for the task
    const { data: task, error } = await supabase
      .from('music_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    if (!task) {
      throw new Error('Task not found');
    }

    console.log('Task status:', task.status);

    if (task.status === 'complete' && task.audio_url) {
      return new Response(
        JSON.stringify({ 
          status: 'complete',
          audioUrl: task.audio_url,
          title: task.title || 'Untitled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (task.status === 'error') {
      throw new Error(task.error_message || 'Music generation failed');
    }

    // Still processing
    return new Response(
      JSON.stringify({ status: 'processing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error checking music status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
