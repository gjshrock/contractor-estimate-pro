import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { estimateDrywall } from "../lib/estimators/drywall";
import { estimatePainting } from "../lib/estimators/painting";
import {
  estimateFlooring,
  estimateTrim,
  estimateFraming,
} from "../lib/estimators/common";
import { estimateDeck } from "../lib/estimators/deck";

const router = Router();

function cleanJson(text: string): string {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

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
    ? `

CONTRACTOR PROFILE:
- Hourly rate: $${hourlyRate}/hr
- Years of experience: ${yearsExperience ?? 0} year${(yearsExperience ?? 0) === 1 ? "" : "s"}

You MUST include a "laborEstimate" section in your response using this contractor's profile.

EXPERIENCE SPEED MULTIPLIER GUIDE:
- 0–1 years: 1.40
- 1–3 years: 1.20
- 3–7 years: 1.00
- 7–15 years: 0.85
- 15+ years: 0.75

Calculate baseHours for an average 5-year contractor, then apply the appropriate multiplier for ${
        yearsExperience ?? 0
      } years.`
    : `

No contractor profile provided — set laborEstimate to null in your response.`;

  const systemPrompt = `You are an expert construction estimator with 20+ years of experience across residential and commercial projects.

Your job is to analyze a contractor's job description and produce:
1. A detailed, realistic itemized materials list with accurate current pricing
2. A labor estimate if a contractor profile is provided

PRICING GUIDELINES:
- Reference typical Home Depot and Lowe's retail prices
- Use realistic quantities based on the job scope
- Include all necessary materials such as fasteners, adhesives, primer, sealants, blades, tape, screws, disposal bags, and other required supplies
- Do not include tool purchases unless the tool is clearly consumable, rented, or specifically needed as a project cost

CRITICAL JSON RULES:
- Return ONLY valid raw JSON
- Do NOT include markdown
- Do NOT include explanations outside the JSON
- Do NOT include comments
- Do NOT use // comments
- Do NOT use /* */ comments
- Do NOT use trailing commas
- Use double quotes for every string and property name
- Use null for empty values
- Every numeric field must be a number, not a string

Return this exact JSON shape:
{
  "jobSummary": "Brief 1-2 sentence summary of the job",
  "materials": [
    {
      "id": "mat-1",
      "name": "Material name",
      "description": "Specific spec or product description",
      "category": "Category",
      "quantity": 10,
      "unit": "pieces",
      "unitPrice": 4.97,
      "totalPrice": 49.7,
      "storeName": "Home Depot",
      "notes": null
    }
  ],
  "grandTotal": 1234.56,
  "laborEstimate": null,
  "disclaimer": "Prices are estimates based on typical Home Depot and Lowe's retail pricing and may vary by region and availability. Labor estimates are based on industry averages and may vary. Always verify before submitting a final bid."
}

If a contractor profile IS provided, replace laborEstimate null with:
{
  "baseHours": 16,
  "experienceMultiplier": 0.85,
  "adjustedHours": 13.6,
  "totalLaborCost": 1224,
  "breakdown": [
    { "task": "Demo and site prep", "hours": 2 },
    { "task": "Framing", "hours": 4 },
    { "task": "Install materials", "hours": 6 },
    { "task": "Finishing and cleanup", "hours": 1.6 }
  ],
  "experienceNote": "At X years experience, you work Y% faster than average."
}

Rules:
- Include 8-20 material line items depending on job complexity
- grandTotal must equal the sum of all material totalPrice values
- notes field must be null if no special notes, or a short string for important callouts
- id must be unique using strings like "mat-1", "mat-2", "mat-3"
- Labor breakdown must include 4-7 tasks covering the full job scope
- Make sure the final answer can be parsed by JSON.parse with no cleanup required${laborContext}`;

  const userPrompt = `Generate a detailed estimate for this job: ${jobDescription.trim()}${locationContext}`;

const lowerPrompt = jobDescription.toLowerCase();

const drywallMatch =
  lowerPrompt.includes("drywall") ||
  lowerPrompt.includes("sheetrock") ||
  lowerPrompt.includes("gypsum");

if (drywallMatch) {
  const sqFtMatch = lowerPrompt.match(/(\d+)\s*(sq ft|square feet|sf)/);

  const areaSqFt = sqFtMatch ? parseInt(sqFtMatch[1], 10) : 200;

  const estimate = estimateDrywall({
    areaSqFt,
    includeLabor: hasLabor,
    hourlyRate,
    yearsExperience,
  });

  res.json(estimate);
  return;
}

const paintingMatch =
  lowerPrompt.includes("paint") ||
  lowerPrompt.includes("painting");

if (paintingMatch) {
  const sqFtMatch = lowerPrompt.match(/(\d+)\s*(sq ft|square feet|sf)/);

  const areaSqFt = sqFtMatch ? parseInt(sqFtMatch[1], 10) : 500;

  const estimate = estimatePainting({
    wallAreaSqFt: areaSqFt,
    coats: 2,
    includeLabor: hasLabor,
    hourlyRate,
    yearsExperience,
  });

  res.json(estimate);
  return;
}


const flooringMatch =
  lowerPrompt.includes("flooring") ||
  lowerPrompt.includes("floor") ||
  lowerPrompt.includes("hardwood") ||
  lowerPrompt.includes("wood floor") ||
  lowerPrompt.includes("vinyl plank") ||
  lowerPrompt.includes("vinyl") || 
  lowerPrompt.includes("lvp") ||
  lowerPrompt.includes("laminate");
if (flooringMatch) {
  const sqFtMatch = lowerPrompt.match(/(\d+)\s*(sq ft|square feet|sf)/);

  const areaSqFt = sqFtMatch ? parseInt(sqFtMatch[1], 10) : 500;

  const estimate = estimateFlooring({
    areaSqFt,
    includeLabor: hasLabor,
    hourlyRate,
    yearsExperience,
  });

  res.json(estimate);
  return;
}

const trimMatch =
  lowerPrompt.includes("trim") ||
  lowerPrompt.includes("baseboard") ||
  lowerPrompt.includes("crown molding");

if (trimMatch) {
  const linearFeetMatch = lowerPrompt.match(
    /(\d+)\s*(linear feet|lf|ft)/
  );

  const linearFeet = linearFeetMatch
    ? parseInt(linearFeetMatch[1], 10)
    : 120;

  const estimate = estimateTrim({
    linearFeet,
    includeLabor: hasLabor,
    hourlyRate,
    yearsExperience,
  });

  res.json(estimate);
  return;
}

const framingMatch =
  lowerPrompt.includes("frame") ||
  lowerPrompt.includes("framing") ||
  lowerPrompt.includes("wall framing");

if (framingMatch) {
  const wallFeetMatch = lowerPrompt.match(
    /(\d+)\s*(linear feet|lf|ft)/
  );

  const wallLengthFt = wallFeetMatch
    ? parseInt(wallFeetMatch[1], 10)
    : 16;

  const estimate = estimateFraming({
    wallLengthFt,
    includeLabor: hasLabor,
    hourlyRate,
    yearsExperience,
  });

  res.json(estimate);
  return;
}

const deckMatch =
  lowerPrompt.includes("deck") ||
  lowerPrompt.includes("decking");

if (deckMatch) {
  const dimensionMatch = lowerPrompt.match(/(\d+)\s*[x×]\s*(\d+)/);

  const lengthFt = dimensionMatch ? parseInt(dimensionMatch[1], 10) : 12;
  const widthFt = dimensionMatch ? parseInt(dimensionMatch[2], 10) : 16;

  const estimate = estimateDeck({
    lengthFt,
    widthFt,
    includeLabor: hasLabor,
    hourlyRate: hourlyRate ?? 0,
    yearsExperience: yearsExperience ?? 0,
  });

  res.json(estimate);
  return;
}


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

    const parsed = JSON.parse(cleanJson(content)) as {
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

    const recalcTotal = parsed.materials.reduce((sum, material) => {
      material.totalPrice = Math.round(material.quantity * material.unitPrice * 100) / 100;
      return sum + material.totalPrice;
    }, 0);

    parsed.grandTotal = Math.round(recalcTotal * 100) / 100;

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
