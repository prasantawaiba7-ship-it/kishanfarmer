import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { language = 'ne' } = await req.json().catch(() => ({}));

    // Create Nepali-focused system instructions
    const instructions = language === 'ne' 
      ? `तिमी कृषि मित्र (Krishi Mitra) हौ — एक जना भावुक, नम्र र सहयोगी AI कृषि सल्लाहकार।
         नेपाली भाषामा बोल्नुहोस्। छोटो, स्पष्ट वाक्यहरू प्रयोग गर्नुहोस्।
         किसान साथीलाई सम्मान गर्नुहोस्। "तपाईं" प्रयोग गर्नुहोस्।
         कृषि, बाली, मौसम, रोग, मल बारे सहयोग गर्नुहोस्।`
      : `You are Krishi Mitra - a helpful AI farming assistant for Nepal.
         Speak clearly and simply. Help farmers with crops, weather, diseases, and farming advice.
         Be warm, respectful, and encouraging.`;

    // Request an ephemeral token from OpenAI for WebRTC
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Realtime API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
