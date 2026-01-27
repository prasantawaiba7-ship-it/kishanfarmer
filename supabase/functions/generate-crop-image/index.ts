import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop_id, crop_name_en, crop_name_ne, category } = await req.json();
    
    if (!crop_id || !crop_name_en) {
      return new Response(
        JSON.stringify({ error: 'crop_id and crop_name_en are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Generating AI image for crop: ${crop_name_en} (${category})`);

    // Build the image generation prompt
    const categoryContextMap: Record<string, string> = {
      vegetable: 'fresh vegetable plant with mature produce',
      fruit: 'fruit tree or plant with ripe fruit',
      grain: 'grain crop field with mature heads',
      spice: 'spice plant with aromatic parts visible',
      legume: 'legume plant with pods',
      pulse: 'pulse crop with seed pods'
    };
    const categoryContext = categoryContextMap[category as string] || 'agricultural crop';

    const prompt = `High quality, realistic photograph of ${crop_name_en} (${crop_name_ne || ''}) as a ${categoryContext}. 
    The image should show a healthy, vibrant plant with clear details.
    Natural lighting, farm setting, professional agricultural photography style.
    Clean composition with the main crop as the focal point.
    Ultra high resolution, 4:3 aspect ratio.`;

    // Call Lovable AI for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI image generation error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI image generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the generated image
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI did not generate an image. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The image is base64 encoded, we need to upload it to storage
    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format from AI");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase storage
    const fileName = `ai-generated/${crop_id}_${Date.now()}.${imageFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crop-images')
      .upload(fileName, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('crop-images')
      .getPublicUrl(fileName);

    console.log("Image uploaded to:", publicUrl);

    // Update the crop record with the AI-suggested image
    const { error: updateError } = await supabase
      .from('crops')
      .update({
        image_url_ai_suggested: publicUrl,
        needs_image_review: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', crop_id);

    if (updateError) {
      console.error("Crop update error:", updateError);
      throw new Error(`Failed to update crop: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: publicUrl,
        message: 'AI image generated and saved for review'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("generate-crop-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
