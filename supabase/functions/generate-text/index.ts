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
    const { prompt, type, genre } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate prompt length to prevent excessive API costs
    if (typeof prompt !== 'string' || prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Prompt must be a string with maximum 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate type parameter
    const validTypes = ['story', 'poetry', 'script', 'lyrics'];
    if (type && !validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type. Must be one of: story, poetry, script, lyrics' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate genre parameter when type is lyrics
    const validGenres = ['pop', 'rock', 'hip-hop', 'country', 'rnb', 'jazz', 'electronic', 'folk', 'metal', 'indie'];
    if (type === 'lyrics' && genre && !validGenres.includes(genre)) {
      return new Response(
        JSON.stringify({ error: 'Invalid genre. Must be one of: pop, rock, hip-hop, country, rnb, jazz, electronic, folk, metal, indie' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create system prompt based on type
    const systemPrompts = {
      story: 'You are a creative storyteller. Write engaging, vivid short stories with compelling narratives, interesting characters, and satisfying conclusions.',
      poetry: 'You are a skilled poet. Create beautiful, evocative poetry with rich imagery, emotion, and meaningful metaphors.',
      script: 'You are a professional screenwriter. Write compelling dialogue and scene descriptions for film or theater scripts with strong character voices and dramatic structure.',
      lyrics: `You are a talented songwriter and lyricist specializing in ${genre || 'pop'} music. Write compelling ${genre || 'pop'} song lyrics with memorable hooks, verses, choruses, and bridges. Incorporate the characteristic style, themes, and rhythmic patterns typical of ${genre || 'pop'} music. Include emotional depth and rhyme schemes that flow naturally when sung.`
    };

    const systemPrompt = systemPrompts[type as keyof typeof systemPrompts] || systemPrompts.story;

    console.log('Generating text with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Successfully generated text');

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-text function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
