import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PillAnalysisResult {
  name: string;
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert pharmaceutical identification AI assistant. Analyze pill images and provide detailed identification information.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no markdown or additional text:
{
  "name": "Generic name (Brand name)",
  "confidence": 0.85,
  "description": "Brief description of the medication",
  "color": "Color of the pill",
  "shape": "Shape of the pill (round, oval, capsule, etc.)",
  "imprint": "Any visible text, numbers, or symbols on the pill",
  "usage": "Common medical uses for this medication",
  "warnings": ["Warning 1", "Warning 2"]
}

If you cannot identify the pill with confidence, still provide your best analysis with a lower confidence score (0.3-0.5) and mention uncertainty in the description.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this pill image and identify it. Provide the pill name, confidence level, physical characteristics (color, shape, imprint), usage, and any important warnings."
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
        max_tokens: 1024,
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
      // Provide a fallback result
      result = {
        name: "Unknown Pill",
        confidence: 0.3,
        description: "Unable to identify this pill with certainty. Please consult a pharmacist.",
        color: "Unknown",
        shape: "Unknown",
        imprint: "Unable to determine",
        usage: "Unknown - please consult a healthcare professional",
        warnings: ["Always verify medications with a licensed pharmacist before use"],
      };
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
