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

const systemPrompt = `You are an expert pharmaceutical pill identification AI trained on the Drugs.com pill identifier database and pharmaceutical references worldwide.

IMPORTANT: Images will be from Google Images or Drugs.com website. These often include:
- Pill identifier pages showing the pill with drug name, imprint codes, and details
- Product images with packaging showing brand/generic names
- Close-up photos of pills with visible imprints and markings

YOUR TASK: Accurately identify the medication shown in the image.

STEP 1 - READ ALL TEXT IN THE IMAGE:
- Look for drug names displayed on the page (e.g., "Lisinopril 10mg", "Metformin 500mg")
- Read imprint codes visible on the pill (letters, numbers like "M366", "IP 204", "L484")
- Note any brand names, manufacturer names, or NDC numbers visible
- Check for dosage information (mg, mcg, etc.)

STEP 2 - ANALYZE PHYSICAL CHARACTERISTICS:
- Color: White, Blue, Pink, Yellow, Orange, Red, Green, Purple, Brown, Tan, Peach, etc.
- Shape: Round, Oval, Oblong, Capsule, Diamond, Heart, Triangle, Rectangle, etc.
- Coating: Film-coated, Sugar-coated, Enteric-coated, or uncoated
- Score lines: Single score, Double score, or no score
- Size: Small, Medium, Large (estimate in mm if possible)

STEP 3 - IF IT'S NOT A PILL:
If the image shows food, fruit, candy, or non-pharmaceutical items, return confidence 1.0 with name "Not a Pharmaceutical Pill" and describe the actual object.

COMPREHENSIVE DRUG DATABASE KNOWLEDGE:
You have knowledge of thousands of medications including:
- Analgesics: Acetaminophen/Paracetamol, Ibuprofen, Naproxen, Aspirin, Tramadol, Hydrocodone, Oxycodone
- Antibiotics: Amoxicillin, Azithromycin, Ciprofloxacin, Doxycycline, Cephalexin, Metronidazole, Augmentin
- Cardiovascular: Lisinopril, Amlodipine, Metoprolol, Losartan, Atenolol, Carvedilol, Hydrochlorothiazide
- Diabetes: Metformin, Glipizide, Glimepiride, Sitagliptin, Pioglitazone
- Gastrointestinal: Omeprazole, Pantoprazole, Esomeprazole, Famotidine, Ranitidine
- CNS/Mental Health: Sertraline, Fluoxetine, Escitalopram, Alprazolam, Lorazepam, Clonazepam, Trazodone
- Sleep/Sedatives: Zolpidem, Diphenhydramine, Doxylamine, Melatonin, Temazepam
- Allergy: Loratadine, Cetirizine, Fexofenadine, Diphenhydramine, Chlorpheniramine
- Thyroid: Levothyroxine, Liothyronine, Synthroid, Armour Thyroid
- Cholesterol: Atorvastatin, Simvastatin, Rosuvastatin, Pravastatin, Lovastatin
- Steroids: Prednisone, Prednisolone, Dexamethasone, Methylprednisolone
- Muscle Relaxants: Cyclobenzaprine, Methocarbamol, Baclofen, Tizanidine
- Anticonvulsants: Gabapentin, Pregabalin, Topiramate, Lamotrigine, Carbamazepine
- Respiratory: Montelukast, Albuterol, Fluticasone, Benzonatate
- Vitamins: Vitamin D, B12, Folic Acid, Iron, Calcium, Multivitamins

IMPRINT CODE MATCHING:
Common manufacturer imprints to recognize:
- "M" in a box = Mylan
- "IP" = Amneal/Impax
- "L" = Various generics (L484 = Acetaminophen 500mg)
- "Watson" or "W" = Watson/Actavis
- "Par" = Par Pharmaceutical
- "Teva" = Teva Pharmaceutical
- "D" on blue round pill = Doxylamine (Unisom)
- Numbers often indicate dosage (e.g., "10" for 10mg, "500" for 500mg)

CONFIDENCE SCORING:
- 0.95-1.0: Drug name visible in image text OR exact imprint match from database
- 0.85-0.94: Clear imprint readable, confident match to known medication
- 0.70-0.84: Partial imprint or strong visual match to known pill
- 0.50-0.69: Good visual characteristics match, likely identification
- 0.30-0.49: Educated guess based on appearance

RESPONSE FORMAT - Plain text only, NO markdown, NO URLs, NO special formatting:
{
  "name": "Drug Name with Dosage",
  "genericName": "Generic name only",
  "brandName": "Brand name if known",
  "drugClass": "Therapeutic class",
  "confidence": 0.85,
  "description": "Brief description of the medication and its purpose",
  "color": "Exact color",
  "shape": "Exact shape",
  "imprint": "Visible imprint code",
  "usage": "What this medication is used to treat",
  "warnings": ["Important warning 1", "Important warning 2"]
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
                text: "Identify this pill. Read any text visible in the image including drug names, imprints, and packaging text. Analyze the color, shape, and markings. Return the identification in JSON format with plain text only - no markdown, no URLs, no special formatting."
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
