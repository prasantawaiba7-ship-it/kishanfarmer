import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detect if text contains significant Devanagari (Nepali/Hindi) script
function containsDevanagari(text: string): boolean {
  const devanagariPattern = /[\u0900-\u097F]/g;
  const matches = text.match(devanagariPattern);
  const nonWhitespace = text.replace(/\s/g, '').length;
  return matches ? (matches.length / nonWhitespace) > 0.1 : false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect if text contains Devanagari script (Nepali/Hindi)
    const hasDevanagari = containsDevanagari(text);
    const isNepaliContent = language === 'ne' || language === 'hi' || hasDevanagari;
    
    // Voice selection based on language AND content detection
    // For Nepali/Hindi content: Use Lily (warm multilingual female voice that handles Devanagari well)
    // For English: Use Sarah (natural female voice)
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      if (isNepaliContent) {
        // Lily - excellent for Nepali/Hindi/Devanagari text (multilingual v2)
        selectedVoiceId = "pFZP5JQG7iQjIQuC4Bku";
      } else {
        // Sarah - warm English voice
        selectedVoiceId = "EXAVITQu4vr4xnSDxMaL";
      }
    }

    console.log(`[TTS] Generating speech - length: ${text.length}, voice: ${selectedVoiceId}, language: ${language || 'auto'}, hasDevanagari: ${hasDevanagari}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // Supports 29 languages including Nepali
          voice_settings: {
            stability: isNepaliContent ? 0.65 : 0.5, // Higher stability for clearer Nepali pronunciation
            similarity_boost: 0.75,
            style: 0.15, // Lower for more natural speech
            use_speaker_boost: true,
            speed: isNepaliContent ? 0.9 : 1.0, // Slightly slower for clearer Nepali
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] ElevenLabs API error:", response.status, errorText);

      // IMPORTANT: Return 200 so the frontend can gracefully fall back to browser TTS
      return new Response(
        JSON.stringify({
          ok: false,
          status: response.status,
          error: `ElevenLabs API error: ${response.status}`,
          detail: errorText,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[TTS] Success - audio size: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: unknown) {
    console.error("[TTS] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
