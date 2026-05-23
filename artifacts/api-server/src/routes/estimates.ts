import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/estimates/generate", async (req, res) => {
  const { jobDescription, location } = req.body as {
    jobDescription?: string;
    location?: string | null;
  };

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 5) {
    res.status(400).json({
      error: "INVALID_INPUT",
      message: "Please provide a job description (at least 5 characters).",
    });
    return;
  }

  const locationContext = location ? ` The project is located in ${location}.` : "";

  const systemPrompt = `You are an expert construction estimator with 20+ years of experience across residential and commercial projects. You have deep knowledge of current material prices at Home Depot and Lowe's.

Your job is to analyze a contractor's job description and produce a detailed, realistic, itemized materials list with accurate current pricing.

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
      "id": "unique-id-1",
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
  "disclaimer": "Prices are estimates based on current Home Depot and Lowe's retail pricing and may vary by region and availability. Always verify current prices before submitting a final bid."
}

Rules:
- Include 8-20 line items depending on job complexity
- Group similar materials by category
- Use realistic unit prices (verify against what you know about current store prices)
- grandTotal must equal the sum of all totalPrice values
- notes field: use null if no special notes, or a short string for important callouts
- id must be unique (use simple strings like "mat-1", "mat-2", etc.)`;

  const userPrompt = `Generate a detailed material cost estimate for this job: ${jobDescription.trim()}${locationContext}

Provide realistic quantities and current retail prices from Home Depot or Lowe's.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
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
      disclaimer: string;
    };

    // Recalculate grandTotal to ensure accuracy
    const recalcTotal = parsed.materials.reduce((sum, m) => sum + m.totalPrice, 0);
    parsed.grandTotal = Math.round(recalcTotal * 100) / 100;

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
