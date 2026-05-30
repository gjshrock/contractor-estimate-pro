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

function getSqFt(prompt: string, fallback: number) {
  const match = prompt.match(/(\d+)\s*(sq ft|square feet|sf)/);
  return match ? parseInt(match[1], 10) : fallback;
}

function getLinearFt(prompt: string, fallback: number) {
  const match = prompt.match(/(\d+)\s*(linear feet|linear ft|lf|ft)/);
  return match ? parseInt(match[1], 10) : fallback;
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

  const lowerPrompt = jobDescription.toLowerCase();
  const locationContext = location ? ` The project is located in ${location}.` : "";
  const hasLabor = typeof hourlyRate === "number" && hourlyRate > 0;

  // ─── Deterministic Drywall / Sheetrock ────────────────────────────────
  const drywallMatch =
    lowerPrompt.includes("drywall") ||
    lowerPrompt.includes("sheetrock") ||
    lowerPrompt.includes("gypsum");

  if (drywallMatch) {
    const estimate = estimateDrywall({
      areaSqFt: getSqFt(lowerPrompt, 200),
      includeLabor: hasLabor,
      hourlyRate: hourlyRate ?? 0,
      yearsExperience: yearsExperience ?? 0,
    });

    res.json(estimate);
    return;
  }

  // ─── Deterministic Painting ───────────────────────────────────────────
  const paintingMatch =
    lowerPrompt.includes("paint") ||
    lowerPrompt.includes("painting");

  if (paintingMatch) {
    const estimate = estimatePainting({
      wallAreaSqFt: getSqFt(lowerPrompt, 500),
      coats: lowerPrompt.includes("one coat") || lowerPrompt.includes("1 coat") ? 1 : 2,
      includeLabor: hasLabor,
      hourlyRate: hourlyRate ?? 0,
      yearsExperience: yearsExperience ?? 0,
    });

    res.json(estimate);
    return;
  }

  // ─── Deterministic Deck ───────────────────────────────────────────────
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

  // ─── Deterministic Flooring ───────────────────────────────────────────
  const flooringMatch =
    lowerPrompt.includes("flooring") ||
    lowerPrompt.includes("floor") ||
    lowerPrompt.includes("hardwood") ||
    lowerPrompt.includes("wood floor") ||
    lowerPrompt.includes("vinyl plank") ||
    lowerPrompt.includes("lvp") ||
    lowerPrompt.includes("laminate");

  if (flooringMatch) {
    const flooringType = lowerPrompt.includes("tile") || lowerPrompt.includes("ceramic") || lowerPrompt.includes("porcelain")
      ? "tile"
      : lowerPrompt.includes("hardwood") || lowerPrompt.includes("wood floor")
      ? "hardwood"
      : lowerPrompt.includes("laminate")
      ? "laminate"
      : "lvp";

    const estimate = estimateFlooring({
      areaSqFt: getSqFt(lowerPrompt, 500),
      flooringType,
      includeLabor: hasLabor,
      hourlyRate: hourlyRate ?? 0,
      yearsExperience: yearsExperience ?? 0,
    });

    res.json(estimate);
    return;
  }

  // ─── Deterministic Trim ───────────────────────────────────────────────
  const trimMatch =
    lowerPrompt.includes("trim") ||
    lowerPrompt.includes("baseboard") ||
    lowerPrompt.includes("crown molding");

  if (trimMatch) {
    const estimate = estimateTrim({
      linearFeet: getLinearFt(lowerPrompt, 120),
      includeLabor: hasLabor,
      hourlyRate: hourlyRate ?? 0,
      yearsExperience: yearsExperience ?? 0,
    });

    res.json(estimate);
    return;
  }

  // ─── Deterministic Framing ────────────────────────────────────────────
  const framingMatch =
    lowerPrompt.includes("frame") ||
    lowerPrompt.includes("framing") ||
    lowerPrompt.includes("wall framing");

  if (framingMatch) {
    const estimate = estimateFraming({
      wallLengthFt: getLinearFt(lowerPrompt, 16),
      includeLabor: hasLabor,
      hourlyRate: hourlyRate ?? 0,
      yearsExperience: yearsExperience ?? 0,
    });

    res.json(estimate);
    return;
  }

  // ─── AI fallback for unsupported jobs ─────────────────────────────────
  const laborContext = hasLabor
    ? `

CONTRACTOR PROFILE:
- Hourly rate: $${hourlyRate}/hr
- Years of experience: ${yearsExperience ?? 0}

Include a laborEstimate section.`
    : `

No contractor profile provided — set laborEstimate to null.`;

  const systemPrompt = `You are an expert construction estimator.

Return ONLY valid raw JSON.
Do NOT include markdown.
Do NOT include explanations.
Do NOT include comments.
Do NOT use trailing commas.

JSON shape:
{
  "jobSummary": "Brief summary",
  "materials": [
    {
      "id": "mat-1",
      "name": "Material name",
      "description": "Description",
      "category": "Category",
      "quantity": 1,
      "unit": "unit",
      "unitPrice": 1,
      "totalPrice": 1,
      "storeName": "Home Depot",
      "notes": null
    }
  ],
  "grandTotal": 1,
  "laborEstimate": null,
  "disclaimer": "Prices are estimates and may vary."
}

If laborEstimate is included:
{
  "baseHours": 8,
  "experienceMultiplier": 1,
  "adjustedHours": 8,
  "totalLaborCost": 400,
  "breakdown": [
    { "task": "Task name", "hours": 2 }
  ],
  "experienceNote": "Labor adjusted based on experience."
}

Rules:
- Use realistic retail prices
- Keep quantities realistic
- No absurd line items
- No single fastener/screw item should exceed $500 unless the job is unusually large
- grandTotal must equal material totalPrice sum${laborContext}`;

  const userPrompt = `Generate a detailed estimate for this job: ${jobDescription.trim()}${locationContext}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
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

    const parsed = JSON.parse(cleanJson(content));

    const recalcTotal = parsed.materials.reduce((sum: number, material: any) => {
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
