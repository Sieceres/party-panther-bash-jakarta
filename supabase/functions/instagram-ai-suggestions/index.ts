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
    const { eventType, mood, details, suggestionType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (suggestionType === "headline") {
      systemPrompt = `You are a creative social media copywriter specializing in event promotion. Generate catchy, engaging headlines for Instagram posts. Keep headlines short (3-8 words), impactful, and attention-grabbing. Use emojis sparingly but effectively.`;
      userPrompt = `Generate 5 headline options for an Instagram post about:
Event Type: ${eventType || "party/event"}
Mood/Vibe: ${mood || "exciting"}
Details: ${details || "No specific details"}

Return ONLY a JSON array of 5 headline strings, no explanation. Example format:
["Headline 1 🎉", "Headline 2", "Headline 3 ✨", "Headline 4", "Headline 5 🔥"]`;
    } else {
      systemPrompt = `You are a creative social media copywriter specializing in event promotion. Generate engaging body copy for Instagram posts. Keep it concise (1-3 sentences), exciting, and include a call-to-action. Use emojis to enhance the message.`;
      userPrompt = `Generate 3 body text options for an Instagram post about:
Event Type: ${eventType || "party/event"}
Mood/Vibe: ${mood || "exciting"}
Details: ${details || "No specific details"}

Return ONLY a JSON array of 3 body text strings, no explanation. Example format:
["Body text 1 with CTA 📍", "Body text 2 with details ✨", "Body text 3 with urgency 🔥"]`;
    }

    console.log(`Generating ${suggestionType} suggestions for event type: ${eventType}, mood: ${mood}`);

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON array from the response
    let suggestions: string[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines if not valid JSON
        suggestions = content.split('\n').filter((line: string) => line.trim()).slice(0, suggestionType === "headline" ? 5 : 3);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      suggestions = [content];
    }

    console.log(`Generated ${suggestions.length} ${suggestionType} suggestions`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in instagram-ai-suggestions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
