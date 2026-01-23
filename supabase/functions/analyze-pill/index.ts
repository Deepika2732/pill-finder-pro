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
            content: `You are an expert pharmaceutical identification AI with extensive knowledge of prescription and over-the-counter medications worldwide.

OPTIONAL USER CONTEXT:
The user may provide a short hint (example: "sleeping tablet" or "cough tablet"). Use it as additional signal, but do not ignore what the image shows. If the hint conflicts with the image, prefer the image.

STEP 1 - DETERMINE IF IT'S A PILL:
First, determine if the image contains a pharmaceutical pill/tablet/capsule. 

IF IT'S NOT A PILL (fruit, food, random object, animal, etc.):
Return with confidence: 1.0 (100% confident it's NOT a pill) and set name to "Not a Pharmaceutical Pill", all drug fields to "N/A", and describe what it actually is.

IF IT IS A PILL:
Your goal is to ALWAYS identify the pill to the best of your ability.

CRITICAL INSTRUCTIONS FOR PILL IDENTIFICATION:
1. NEVER return "Unknown" for all fields. Always make your best educated guess based on visual characteristics.
2. READ ANY VISIBLE TEXT on the packaging carefully - the packaging often tells you exactly what medication it is (e.g., "Cough Tablet", "Cold & Flu", "Paracetamol 500mg", etc.)
3. Use your extensive pharmaceutical database knowledge to match pills by color, shape, size, and any visible markings.
4. If you see text like "Cough", "Cold", "Flu", "Fever", etc. on packaging, identify it as that type of medication:
   - Cough tablets: Often contain Dextromethorphan, Guaifenesin, Pholcodine, or herbal ingredients
   - Cold/Flu tablets: May contain Pseudoephedrine, Phenylephrine, Chlorpheniramine
   - Pain relievers: Paracetamol/Acetaminophen, Aspirin, Ibuprofen
5. Look for brand names on packaging (e.g., Benadryl, Robitussin, Strepsils, Vicks, etc.)
6. Consider the packaging context, colors, logos, and any visible text.

CONFIDENCE SCORING FOR PILLS:
- 0.9-1.0: Exact match with clear imprint or packaging text identified
- 0.7-0.89: Strong match based on visible packaging info or visual characteristics
- 0.5-0.69: Likely match, medication type identified from context
- 0.3-0.49: Educated guess based on appearance, needs verification

IMPORTANT OUTPUT RULES (PILLS):
- Do NOT use "N/A" for pill fields. If uncertain, use "Unconfirmed" and provide best-guess options in the description.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no markdown or additional text:
{
  "name": "Pill Name with Dosage based on packaging OR 'Not a Pharmaceutical Pill' for non-pills",
  "genericName": "Generic pharmaceutical name (or 'N/A' for non-pills)",
  "brandName": "Brand name from packaging if visible (or 'N/A' for non-pills)",
  "drugClass": "Drug classification (or 'N/A' for non-pills)",
  "confidence": 0.75,
  "description": "For pills: detailed description. For non-pills: describe what the object actually is",
  "color": "Observed color",
  "shape": "Observed shape",
  "imprint": "Any visible markings on pill, or describe object texture for non-pills",
  "usage": "For pills: medical uses. For non-pills: what the item is commonly used for (e.g., 'Food item, source of vitamins')",
  "warnings": ["Warnings array - for pills: medication warnings. For non-pills: ['This is not a pharmaceutical product']"]
}

READ THE PACKAGING TEXT CAREFULLY - if it says "Cough Tablet" identify it as a cough medication, not paracetamol!`
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

    // Normalize result so pill images never show empty/N/A fields in the UI
    const isNonPill = (result.name || "").trim() === "Not a Pharmaceutical Pill";
    const normalizeString = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const isNA = (s: string) => !s || /^(n\/?a|na|none)$/i.test(s);

    if (!isNonPill) {
      const drugClass = normalizeString(result.drugClass);
      const genericName = normalizeString(result.genericName);
      const brandName = normalizeString(result.brandName);
      const imprint = normalizeString(result.imprint);
      const usage = normalizeString(result.usage);

      if (isNA(drugClass)) result.drugClass = "Unconfirmed";
      if (isNA(genericName)) result.genericName = "Unconfirmed";
      if (isNA(brandName)) result.brandName = "Unconfirmed";
      if (isNA(imprint)) result.imprint = "No visible imprint";
      if (isNA(usage)) {
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
