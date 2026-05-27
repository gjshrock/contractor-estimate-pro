import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/estimates/generate", async (req, res) => {
  const { jobDescription, location, hourlyRate, yearsExperience } = req.body as {
    jobDescription?: string;
    location?: string | null;
    hourlyRate?: number | null;
    yearsExperience?: number | null;
  };

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 5) {
    res.status(400).json({
      error: "INVALID_INPUT",
      message: "Please provide a job description (at least 5 characters).",
    });
    return;
  }

  const locationContext = location ? ` The project is located in ${location}.` : "";

  const hasLabor = typeof hourlyRate === "number" && hourlyRate > 0;
  const laborContext = hasLabor
    ? `\n\nCONTRACTOR PROFILE:
- Hourly rate: $${hourlyRate}/hr
- Years of experience: ${yearsExperience ?? 0} year${(yearsExperience ?? 0) === 1 ? "" : "s"}

You MUST include a "laborEstimate" section in your response using this contractor's profile.

EXPERIENCE SPEED MULTIPLIER GUIDE:
- 0–1 years: 1.40 (40% slower than average — still learning)
- 1–3 years: 1.20 (20% slower — building speed)
- 3–7 years: 1.00 (industry average)
- 7–15 years: 0.85 (15% faster — seasoned pro)
- 15+ years: 0.75 (25% faster — expert efficiency)

Calculate baseHours for an average 5-year contractor, then apply the appropriate multiplier for ${yearsExperience ?? 0} years experience to get adjustedHours. Total labor cost = adjustedHours × $${hourlyRate}.`
    : "\n\nNo contractor profile provided — set laborEstimate to null in your response.";

  const systemPrompt = `You are an expert construction estimator with 20+ years of experience across residential and commercial projects. You have deep knowledge of current material prices at Home Depot and Lowe's, and realistic labor time estimates for all types of construction work.

Your job is to analyze a contractor's job description and produce:
1. A detailed, realistic itemized materials list with accurate current pricing
2. A labor estimate (if contractor profile is provided)

PRICING GUIDELINES (as of 2025):
- Reference typical Home Depot and Lowe's retail prices
- Use realistic quantities based on the job scope
- Include all necessary materials (don't skip fasteners, adhesives, primer, etc.)
- Factor in ~10% waste for most materials

Respond ONLY with a valid JSON object in this exact format:
{
  "jobSummary": "Brief 1-2 sentence summary of the job",
  "materials": [
    {
      "id": "mat-1",
      "name": "Material name",
      "description": "Specific spec or product description",
      "category": "Category (e.g. Lumber, Drywall, Hardware, Paint, Concrete, Flooring, Roofing, Plumbing, Electrical, Fasteners)",
      "quantity": 10,
      "unit": "pieces",
      "unitPrice": 4.97,
      "totalPrice": 49.70,
      "storeName": "Home Depot",
      "notes": null
    }
  ],
  "grandTotal": 1234.56,
  "laborEstimate": null,
  "disclaimer": "Prices are estimates based on current Home Depot and Lowe's retail pricing and may vary by region and availability. Labor estimates are based on industry averages and may vary. Always verify before submitting a final bid."
}

If a contractor profile IS provided, replace laborEstimate null with:
{
  "baseHours": 16.0,
  "experienceMultiplier": 0.85,
  "adjustedHours": 13.6,
  "totalLaborCost": 1224.00,
  "breakdown": [
    { "task": "Demo and site prep", "hours": 2.0 },
    { "task": "Framing", "hours": 4.0 },
    { "task": "Install materials", "hours": 6.0 },
    { "task": "Finishing and cleanup", "hours": 1.6 }
  ],
  "experienceNote": "At X years experience, you work Y% faster than average."
}

Rules:
- Include 8-20 material line items depending on job complexity
- grandTotal must equal the sum of all material totalPrice values
- notes field: use null if no special notes, or a short string for important callouts
- id must be unique (use simple strings like "mat-1", "mat-2", etc.)
- Labor breakdown: 4-7 tasks covering the full job scope${laborContext}`;

  const userPrompt = `Generate a detailed estimate for this job: ${jobDescription.trim()}${locationContext}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "AI_ERROR", message: "No response from AI model." });
      return;
    }

    const parsed = JSON.parse(content) as {
      jobSummary: string;
      materials: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        storeName: string;
        notes: string | null;
      }>;
      grandTotal: number;
      laborEstimate: {
        baseHours: number;
        experienceMultiplier: number;
        adjustedHours: number;
        totalLaborCost: number;
        breakdown: Array<{ task: string; hours: number }>;
        experienceNote: string;
      } | null;
      disclaimer: string;
    };

    // Recalculate materials grandTotal for accuracy
    const recalcTotal = parsed.materials.reduce((sum, m) => sum + m.totalPrice, 0);
    parsed.grandTotal = Math.round(recalcTotal * 100) / 100;

    // Recalculate labor total if present
    if (parsed.laborEstimate && hasLabor) {
      parsed.laborEstimate.totalLaborCost =
        Math.round(parsed.laborEstimate.adjustedHours * hourlyRate! * 100) / 100;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error generating estimate");
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to generate estimate. Please try again.",
    });
  }
});

export default router;
