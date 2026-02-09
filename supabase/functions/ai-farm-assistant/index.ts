import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractDiseaseKeywords(message: string): string[] {
  const keywords: string[] = [];
  
  const diseasePatterns = [
    /blast|blight|rust|wilt|rot|mildew|virus|curl|spot|smut|borer|armyworm|aphid|mite|moth|hopper|caterpillar/gi,
    /झुलसा|रोग|कीट|माहू|लाही|काट|फफूंदी|सूखना|सड़ना|पीला|भूरा|सफ़ेद/gi,
    /rice blast|late blight|early blight|leaf curl|yellow rust|brown rust|fall armyworm|stem borer|powdery mildew|downy mildew|bacterial wilt|fusarium wilt/gi
  ];

  for (const pattern of diseasePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  const cropPatterns = /rice|wheat|maize|corn|potato|tomato|vegetables|onion|mustard|soybean|cotton|sugarcane|आलू|धान|गेहूँ|मक्का|टमाटर|प्याज़|सरसों|गन्ना|कपास|सोयाबीन/gi;
  const cropMatches = message.match(cropPatterns);
  if (cropMatches) {
    keywords.push(...cropMatches.map(m => m.toLowerCase()));
  }

  return [...new Set(keywords)];
}

async function fetchRelevantTreatments(keywords: string[], supabaseUrl: string, supabaseKey: string) {
  if (keywords.length === 0) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('crop_treatments')
      .select('id, crop_name, disease_or_pest_name, disease_or_pest_name_ne, treatment_title, treatment_title_ne, youtube_video_url, severity_level')
      .eq('is_active', true)
      .or(`disease_or_pest_name.ilike.%${keywords[0]}%,crop_name.ilike.%${keywords[0]}%,treatment_title.ilike.%${keywords[0]}%`)
      .limit(5);

    if (error) {
      console.error('[AI] Error fetching treatments:', error);
      return [];
    }

    const scoredResults = (data || []).map(treatment => {
      let score = 0;
      const treatmentText = `${treatment.crop_name} ${treatment.disease_or_pest_name} ${treatment.treatment_title}`.toLowerCase();
      
      for (const keyword of keywords) {
        if (treatmentText.includes(keyword)) {
          score += 2;
        }
      }
      
      return { ...treatment, score };
    });

    return scoredResults
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch (error) {
    console.error('[AI] Treatment fetch error:', error);
    return [];
  }
}

const getSystemPrompt = (language: string): string => {
  const baseKnowledge = `
## आपका ज्ञान और क्षमताएँ:

### फसल रोग (Crop Diseases):
- **धान (Rice)**: Blast (ब्लास्ट), Sheath Blight (शीथ ब्लाइट), Brown Spot (भूरा धब्बा), Bacterial Leaf Blight (जीवाणु पत्ती झुलसा)
- **गेहूँ (Wheat)**: Yellow Rust (पीला रतुआ), Brown Rust (भूरा रतुआ), Loose Smut (खुला कंडवा), Powdery Mildew (छाछ्या)
- **मक्का (Maize)**: Stem Borer (तना छेदक), Fall Armyworm (फॉल आर्मीवर्म), Turcicum Leaf Blight, Downy Mildew (मृदुरोमिल फफूंदी)
- **आलू (Potato)**: Late Blight (पछेती झुलसा), Early Blight (अगेती झुलसा), Black Scurf, Viral Diseases
- **टमाटर (Tomato)**: Leaf Curl Virus (पत्ती मोड़क विषाणु), Bacterial Wilt (जीवाणु म्लानि), Fusarium Wilt, Blossom End Rot
- **सब्ज़ियाँ**: Diamond Back Moth, Aphids (माहू), Red Spider Mite, Powdery Mildew, Anthracnose
- **प्याज़ (Onion)**: Purple Blotch (बैंगनी धब्बा), Stemphylium Blight, Thrips (थ्रिप्स)
- **सरसों (Mustard)**: White Rust (सफ़ेद रतुआ), Alternaria Blight, Aphids

### रोग पहचान और उपचार:
- लक्षणों को विस्तार से समझाएँ
- जैविक और रासायनिक दोनों उपचार विकल्प दें
- दवाई की मात्रा, समय, और प्रयोग विधि स्पष्ट करें
- रोकथाम और भविष्य के लिए सुझाव दें
- कब विशेषज्ञ की सलाह लेनी चाहिए बताएँ

### कृषि अभ्यास:
- मिट्टी तैयारी और बीज बुवाई
- सिंचाई प्रबंधन
- खाद प्रयोग (जैविक और रासायनिक)
- कीट और रोग प्रबंधन (IPM)
- फसल कटाई और भंडारण

### भारत-विशेष जानकारी:
- भारत के 28 राज्यों और 8 केंद्र शासित प्रदेशों में अलग-अलग जलवायु और खेती की स्थिति
- खरीफ़ (जून-अक्टूबर), रबी (नवंबर-मार्च), ज़ायद (मार्च-जून) मौसम
- MSP (न्यूनतम समर्थन मूल्य) और सरकारी योजनाएँ (PM-Kisan, PMFBY, Soil Health Card)
- मंडी भाव और उपलब्ध कृषि सामग्री
- ICAR/KVK सिफारिशें`;

  const languageInstructions: Record<string, string> = {
    hi: `आप "किसान साथी" (Kisan Sathi) हैं – भारतीय किसानों के लिए विशेषज्ञ कृषि सहायक।

${baseKnowledge}

## जवाब देने की शैली:
- हमेशा सरल हिंदी में जवाब दें
- विस्तृत और गहन जानकारी दें (5-10 वाक्य या आवश्यकतानुसार अधिक)
- रोग या समस्या के बारे में: कारण, लक्षण, उपचार, और रोकथाम सभी बताएँ
- जैविक (🌿) और रासायनिक (💊) दोनों विकल्प दें
- दवाई का नाम, मात्रा, और उपयोग विधि स्पष्ट करें
- भारतीय रुपये (₹) का उपयोग करें
- किसान को प्रोत्साहित करने वाली भाषा का उपयोग करें
- Bullet points और numbering का उपयोग करें

## महत्वपूर्ण नियम:
- "नमस्ते", "नमस्कार" या कोई अभिवादन मत करें – सीधे जवाब दें
- बार-बार औपचारिक भाषा का उपयोग न करें
- सीधे मुद्दे पर आएँ`,

    en: `You are "Kisan Sathi" (Farming Friend) – an expert agricultural assistant for Indian farmers.

${baseKnowledge}

## Response Style:
- Always respond in English
- Provide detailed, comprehensive information (5-10 sentences or more as needed)
- For disease/problem queries: explain causes, symptoms, treatment, AND prevention
- Offer both organic (🌿) and chemical (💊) treatment options
- Clearly state medicine names, dosages, and application methods
- Use Indian Rupees (₹) for prices
- Use encouraging language to support farmers
- Use bullet points and numbering for clarity

## Important Rules:
- Do NOT say "Namaste", "Hello" or any greeting – respond directly to the question
- Do NOT use overly formal language repeatedly
- Get straight to the point with your answers`,
  };
  
  return languageInstructions[language] || languageInstructions.hi;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, language = 'hi' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const recentMessages = messages.slice(-2).map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content[0]?.text || '' : String(msg.content))
    }));

    const latestUserMessage = recentMessages.find((m: any) => m.role === 'user')?.content || '';
    
    const keywords = extractDiseaseKeywords(latestUserMessage);
    let treatments: any[] = [];
    
    if (keywords.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log(`[AI] Extracted keywords: ${keywords.join(', ')}`);
      treatments = await fetchRelevantTreatments(keywords, SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log(`[AI] Found ${treatments.length} relevant treatments`);
    }

    const systemPrompt = getSystemPrompt(language);

    console.log(`[AI] Starting request, lang=${language}, msgs=${recentMessages.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    console.log(`[AI] Response received in ${Date.now() - startTime}ms, status=${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "बहुत अधिक अनुरोध। कुछ समय बाद प्रयास करें।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[AI] Error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "त्रुटि" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (treatments.length > 0) {
      const originalStream = response.body;
      
      const transformedStream = new TransformStream({
        async start(controller) {
          if (originalStream) {
            const reader = originalStream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            } finally {
              reader.releaseLock();
            }
          }
          
          const treatmentsEvent = `\n\ndata: ${JSON.stringify({ treatments })}\n\n`;
          controller.enqueue(new TextEncoder().encode(treatmentsEvent));
          controller.terminate();
        }
      });

      return new Response(transformedStream.readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI] Error:", error);
    return new Response(JSON.stringify({ error: "त्रुटि" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
