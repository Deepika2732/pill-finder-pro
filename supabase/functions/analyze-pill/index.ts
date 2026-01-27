import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PillAnalysisResult {
  name: string;
  genericName: string;
  brandName: string;
  drugClass: string;
  confidence: number;
  description: string;
  color: string;
  shape: string;
  imprint: string;
  usage: string;
  warnings: string[];
}

// Helper function to strip all markdown formatting and URLs
const cleanText = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  return text
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove markdown links [text](url)
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove raw URLs
    .replace(/https?:\/\/[^\s\)]+/g, "")
    // Remove parentheses that contained URLs
    .replace(/\(\s*\)/g, "")
    // Remove backslash escapes
    .replace(/\\([[\]()_*])/g, "$1")
    // Clean up extra whitespace
    .replace(/\s+/g, " ")
    .trim();
};

const systemPrompt = `You are an expert pharmaceutical pill identification specialist with comprehensive knowledge of medications worldwide, including US, European, Indian, and Asian pharmaceutical markets.

CRITICAL INSTRUCTION: READ ALL TEXT IN THE IMAGE FIRST!
Before analyzing physical characteristics, you MUST carefully read:
1. Brand names printed on packaging (e.g., "Hifenac P", "Combiflam", "Crocin", "Dolo")
2. Generic drug names on the strip/box
3. Manufacturer names and logos
4. Dosage information (mg, mcg amounts)
5. Composition details (e.g., "Aceclofenac 100mg + Paracetamol 325mg")

STEP 1 - TEXT EXTRACTION (HIGHEST PRIORITY):
- Read ALL text visible on blister packs, strips, boxes, and labels
- Look for drug names, compositions, manufacturer info
- Indian medications often show composition like "Aceclofenac 100mg + Paracetamol 325mg"
- Brand names are usually prominently displayed

STEP 2 - IDENTIFY BY BRAND/COMPOSITION:
Common combination medications to recognize:
- Hifenac P / Hifenac-P: Aceclofenac 100mg + Paracetamol 325mg (pain relief, anti-inflammatory)
- Combiflam: Ibuprofen 400mg + Paracetamol 325mg (pain relief)
- Zerodol-P: Aceclofenac 100mg + Paracetamol 325mg
- Dolo 650: Paracetamol 650mg (fever, pain)
- Crocin: Paracetamol (fever, pain)
- Flexon: Ibuprofen + Paracetamol
- Sumo: Nimesulide + Paracetamol
- Ultracet: Tramadol + Paracetamol
- Saridon: Propyphenazone + Paracetamol + Caffeine
- Pan 40/Pan D: Pantoprazole (acidity)
- Omez/Omeprazole: Proton pump inhibitor
- Shelcal: Calcium + Vitamin D3
- Limcee: Vitamin C
- Becosules: Vitamin B Complex
- Zincovit: Multivitamin with Zinc
- Allegra: Fexofenadine (antihistamine)
- Cetrizine/Zyrtec: Cetirizine (antihistamine)
- Montair LC: Montelukast + Levocetirizine
- Azithral/Azee: Azithromycin (antibiotic)
- Augmentin: Amoxicillin + Clavulanic acid
- Ciprofloxacin/Ciplox: Antibiotic
- Metformin/Glycomet: Diabetes
- Amlodipine/Amlokind: Blood pressure
- Atorvastatin/Atorva: Cholesterol
- Ecosprin: Aspirin (blood thinner)
- Thyronorm: Levothyroxine (thyroid)
- Nexito/Escitalopram: Antidepressant

STEP 3 - PHYSICAL CHARACTERISTICS (if text is unclear):
- Color: Pink, Orange, White, Yellow, Blue, Green, etc.
- Shape: Oval, Round, Oblong, Capsule, Diamond, etc.
- Coating: Film-coated, sugar-coated, enteric-coated
- Size estimation

STEP 4 - FOR NON-PHARMACEUTICAL ITEMS:
If the image shows food, candy, or non-medication items, return confidence 1.0 with name "Not a Pharmaceutical Pill".

DRUG CLASS CATEGORIES:
- NSAIDs/Analgesics: Pain relievers (Aceclofenac, Ibuprofen, Diclofenac)
- Antipyretics: Fever reducers (Paracetamol/Acetaminophen)
- Antibiotics: Infection fighters (Azithromycin, Amoxicillin, Ciprofloxacin)
- Antihistamines: Allergy relief (Cetirizine, Fexofenadine, Diphenhydramine)
- Antacids/PPIs: Acid reducers (Omeprazole, Pantoprazole, Ranitidine)
- Antidiabetics: Blood sugar control (Metformin, Glimepiride)
- Antihypertensives: Blood pressure (Amlodipine, Losartan, Atenolol)
- Statins: Cholesterol (Atorvastatin, Rosuvastatin)
- Vitamins/Supplements: Nutritional support
- Combination drugs: Multiple active ingredients

CONFIDENCE SCORING:
- 0.95-1.0: Drug name/brand clearly visible in image text
- 0.85-0.94: Composition clearly readable, confident match
- 0.70-0.84: Partial text visible, strong visual match
- 0.50-0.69: Visual characteristics match known medication
- 0.30-0.49: Educated guess based on appearance only

RESPONSE FORMAT - Plain text only, NO markdown, NO URLs, NO special formatting:
{
  "name": "Brand Name with Composition/Dosage",
  "genericName": "Active ingredient(s) with dosage",
  "brandName": "Commercial brand name",
  "drugClass": "NSAID/Analgesic, Antibiotic, Antihistamine, etc.",
  "confidence": 0.85,
  "description": "Brief description of the medication, its composition, and purpose",
  "color": "Exact color of the pill/tablet",
  "shape": "Exact shape",
  "imprint": "Any visible markings or imprints",
  "usage": "Primary uses - conditions it treats, how it works",
  "warnings": ["Important safety warning 1", "Important safety warning 2", "Drug interactions if relevant"]
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Analyzing pill image with AI...");

    // Call Lovable AI Gateway for pill analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "CRITICAL: First READ ALL TEXT visible on the packaging, blister strip, or box - including brand names, drug compositions, manufacturer names, and dosage information. The text on the packaging is the PRIMARY source of identification. Then analyze physical characteristics (color, shape). For Indian/international medications, look for composition details like 'Aceclofenac 100mg + Paracetamol 325mg'. Return the identification in JSON format with plain text only - no markdown, no URLs, no special formatting."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis content received from AI");
    }

    // Parse the JSON response from AI
    let result: PillAnalysisResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Provide a fallback result
      result = {
        name: "Unable to Parse Response",
        genericName: "Unconfirmed",
        brandName: "Unconfirmed",
        drugClass: "Unconfirmed",
        confidence: 0.35,
        description: "The AI was unable to properly analyze this image. Please try again with a clearer image.",
        color: "Unknown",
        shape: "Unknown",
        imprint: "Unable to read",
        usage: "Please upload a clearer image of the pill for accurate identification.",
        warnings: [
          "Do not take medication without proper identification",
          "Consult a pharmacist or healthcare provider to verify"
        ],
      };
    }

    // Check if it's a non-pill item
    const isNonPill = (result.name || "").trim() === "Not a Pharmaceutical Pill";

    // Clean all text fields to remove markdown formatting and URLs
    result.name = cleanText(result.name);
    result.genericName = cleanText(result.genericName);
    result.brandName = cleanText(result.brandName);
    result.drugClass = cleanText(result.drugClass);
    result.description = cleanText(result.description);
    result.color = cleanText(result.color);
    result.shape = cleanText(result.shape);
    result.imprint = cleanText(result.imprint);
    result.usage = cleanText(result.usage);
    if (Array.isArray(result.warnings)) {
      result.warnings = result.warnings.map(w => cleanText(w));
    }

    // Normalize result so pill images never show empty/N/A fields in the UI
    const isNA = (s: string) => !s || /^(n\/?a|na|none|unknown)$/i.test(s);

    if (!isNonPill) {
      if (isNA(result.drugClass)) result.drugClass = "Unconfirmed";
      if (isNA(result.genericName)) result.genericName = "Unconfirmed";
      if (isNA(result.brandName)) result.brandName = "Unconfirmed";
      if (isNA(result.imprint)) result.imprint = "No visible imprint";
      if (isNA(result.usage)) {
        result.usage = "Unable to confirm exact use. Please verify with a pharmacist.";
      }

      if (!Array.isArray(result.warnings) || result.warnings.length === 0) {
        result.warnings = [
          "Do not take medication without positive identification",
          "Consult a pharmacist or healthcare provider to verify",
        ];
      }

      if (typeof result.confidence !== "number" || Number.isNaN(result.confidence)) {
        result.confidence = 0.35;
      }
      result.confidence = Math.max(0, Math.min(1, result.confidence));
    }

    // Save to detection history
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("detection_history").insert({
      pill_name: result.name,
      confidence: result.confidence,
      color: result.color,
      shape: result.shape,
      imprint: result.imprint,
      description: result.description,
      usage: result.usage,
      warnings: result.warnings,
    });

    console.log("Detection saved to history");

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-pill function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Analysis failed" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
