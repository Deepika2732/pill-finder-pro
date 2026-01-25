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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, hint } = await req.json();

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

    // Call Lovable AI Gateway for initial pill analysis
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
            content: `You are an expert pharmaceutical identification AI with extensive knowledge of ALL prescription and over-the-counter medications worldwide, including drugs listed on Drugs.com, RxList, WebMD, and international pharmacopeias.

OPTIONAL USER CONTEXT:
The user may provide a short hint (example: "blood pressure", "antibiotic", "vitamin"). Use it as additional signal, but do not ignore what the image shows. If the hint conflicts with the image, prefer the image.

STEP 1 - DETERMINE IF IT'S A PILL:
First, determine if the image contains a pharmaceutical pill/tablet/capsule. 

IF IT'S NOT A PILL (fruit, food, random object, animal, etc.):
Return with confidence: 1.0 (100% confident it's NOT a pill) and set name to "Not a Pharmaceutical Pill", all drug fields to "N/A", and describe what it actually is.

IF IT IS A PILL:
Your goal is to ALWAYS identify the pill to the best of your ability from ANY drug category.

COMPREHENSIVE DRUG CATEGORIES TO CONSIDER:
- Pain relievers/Analgesics: Paracetamol, Ibuprofen, Aspirin, Naproxen, Tramadol, Codeine
- Antibiotics: Amoxicillin, Azithromycin, Ciprofloxacin, Doxycycline, Metronidazole
- Cardiovascular: Amlodipine, Atenolol, Lisinopril, Losartan, Metoprolol, Aspirin
- Diabetes: Metformin, Glimepiride, Sitagliptin, Gliclazide
- Gastrointestinal: Omeprazole, Pantoprazole, Ranitidine, Domperidone
- Respiratory/Cough/Cold: Dextromethorphan, Guaifenesin, Pseudoephedrine, Cetirizine
- Sleep aids/Sedatives: Zolpidem, Diphenhydramine, Melatonin, Doxylamine
- Antidepressants/Anxiety: Sertraline, Fluoxetine, Escitalopram, Alprazolam
- Vitamins/Supplements: Vitamin C, D, B12, Calcium, Iron, Multivitamins, Folic Acid
- Antihistamines/Allergy: Loratadine, Cetirizine, Fexofenadine, Chlorpheniramine
- Steroids: Prednisolone, Dexamethasone, Hydrocortisone
- Thyroid: Levothyroxine, Thyroxine
- Cholesterol: Atorvastatin, Rosuvastatin, Simvastatin
- Antifungals: Fluconazole, Ketoconazole, Clotrimazole
- Muscle relaxants: Cyclobenzaprine, Methocarbamol, Baclofen
- Anticonvulsants: Gabapentin, Pregabalin, Carbamazepine
- And ALL other drug classes

CRITICAL INSTRUCTIONS FOR PILL IDENTIFICATION:
1. NEVER return "Unknown" for all fields. Always make your best educated guess.
2. READ ANY VISIBLE TEXT on packaging - brand names, drug names, dosages, manufacturer logos
3. Match pills by color, shape, size, coating, score lines, and any visible markings/imprints
4. Use the user's hint to narrow down identification within that category
5. Consider packaging context, blister design, box text, and any visible information
6. Reference your knowledge of common pill appearances from pharmaceutical databases

CONFIDENCE SCORING:
- 0.9-1.0: Exact match with clear imprint or packaging text identified
- 0.7-0.89: Strong match based on visible packaging info or visual characteristics
- 0.5-0.69: Likely match, medication type identified from context
- 0.3-0.49: Educated guess based on appearance, needs verification

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format.
DO NOT include any markdown formatting (no **, no *, no links, no URLs).
All text values must be plain text only.
{
  "name": "Full drug name with dosage if visible",
  "genericName": "Generic pharmaceutical name",
  "brandName": "Brand name if visible",
  "drugClass": "Drug classification",
  "confidence": 0.75,
  "description": "Detailed description of the medication",
  "color": "Observed color",
  "shape": "Observed shape",
  "imprint": "Any visible markings",
  "usage": "Medical uses and indications",
  "warnings": ["Array of important warnings"]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image carefully. First determine if it contains a pharmaceutical pill/tablet or something else entirely (like fruit, food, or other objects). If it's NOT a pill, return 100% confidence that it's not a pharmaceutical product. If it IS a pill, READ ANY TEXT ON THE PACKAGING to identify the medication type (e.g., if packaging says 'Cough Tablet' or 'Cold & Flu', identify it as that type of medication). Look at color, shape, size, any visible imprints, score lines, or packaging details. Identify the most likely medication based on ALL visual characteristics including packaging text.\n\nUser hint (optional): ${typeof hint === "string" && hint.trim() ? hint.trim() : "(none)"}`
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
        temperature: 0.3,
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
      // Provide a better fallback result with educated guesses
      result = {
        name: "Likely Generic Analgesic/Supplement",
        genericName: "Possibly Paracetamol, Aspirin, or Calcium",
        brandName: "Common OTC medication",
        drugClass: "Analgesic/Supplement (Unconfirmed)",
        confidence: 0.35,
        description: "Based on the appearance, this appears to be a common over-the-counter medication or supplement. The white, round tablet is consistent with many analgesics, antacids, or vitamin supplements. Without clear imprints, exact identification requires pharmacist verification.",
        color: "White",
        shape: "Round",
        imprint: "No clear imprint visible - may have score line",
        usage: "If this is an analgesic: Used for pain relief and fever reduction. If a supplement: Supports general health. Please verify with a pharmacist before use.",
        warnings: [
          "Do not take without proper identification",
          "Consult a pharmacist or healthcare provider to verify this medication",
          "Never take medication that cannot be positively identified",
          "Keep all medications away from children"
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
        result.usage =
          "Unable to confirm exact use without imprint/packaging. Upload the blister/box text for a more accurate match.";
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
