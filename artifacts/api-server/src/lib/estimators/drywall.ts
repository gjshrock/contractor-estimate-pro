export type DrywallEstimateInput = {
  areaSqFt: number;
  includeLabor: boolean;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
};

export function estimateDrywall(input: DrywallEstimateInput) {
  const area = input.areaSqFt;

  const sheetCoverageSqFt = 32;
  const wasteFactor = 1.15;

  const sheetCount = Math.ceil((area / sheetCoverageSqFt) * wasteFactor);
  const screwBoxes = Math.max(1, Math.ceil(sheetCount / 15));
  const jointCompoundBuckets = Math.max(1, Math.ceil(area / 350));
  const tapeRolls = Math.max(1, Math.ceil(area / 500));
  const primerGallons = Math.max(1, Math.ceil(area / 350));

  const materials = [
    {
      id: "mat-1",
      name: "1/2 in. drywall sheets",
      description: "Standard 4 ft x 8 ft gypsum drywall panels",
      category: "Drywall",
      quantity: sheetCount,
      unit: "sheets",
      unitPrice: 14.98,
      totalPrice: round(sheetCount * 14.98),
      storeName: "Home Depot",
      notes: "Includes 15% waste factor",
    },
    {
      id: "mat-2",
      name: "Drywall screws",
      description: "Coarse thread drywall screws",
      category: "Fasteners",
      quantity: screwBoxes,
      unit: "box",
      unitPrice: 9.98,
      totalPrice: round(screwBoxes * 9.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-3",
      name: "Joint compound",
      description: "Ready-mixed all-purpose drywall joint compound",
      category: "Drywall",
      quantity: jointCompoundBuckets,
      unit: "bucket",
      unitPrice: 18.98,
      totalPrice: round(jointCompoundBuckets * 18.98),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-4",
      name: "Drywall tape",
      description: "Paper drywall joint tape",
      category: "Drywall",
      quantity: tapeRolls,
      unit: "roll",
      unitPrice: 4.98,
      totalPrice: round(tapeRolls * 4.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-5",
      name: "Primer",
      description: "Interior drywall primer",
      category: "Paint",
      quantity: primerGallons,
      unit: "gallon",
      unitPrice: 21.98,
      totalPrice: round(primerGallons * 21.98),
      storeName: "Home Depot",
      notes: "Primer only, paint not included",
    },
  ];

  const grandTotal = round(materials.reduce((sum, item) => sum + item.totalPrice, 0));

  const laborEstimate = input.includeLabor
    ? buildDrywallLabor(area, input.hourlyRate ?? 0, input.yearsExperience ?? 0)
    : null;

  return {
    jobSummary: `Drywall replacement estimate for approximately ${area} sq ft.`,
    materials,
    grandTotal,
    laborEstimate,
    disclaimer:
      "Prices are estimates based on typical retail pricing and may vary by region and availability. Verify all quantities and pricing before submitting a final bid.",
  };
}

function buildDrywallLabor(areaSqFt: number, hourlyRate: number, yearsExperience: number) {
  const baseHours = round(Math.max(4, areaSqFt / 40));

  const experienceMultiplier =
    yearsExperience < 1 ? 1.4 :
    yearsExperience < 3 ? 1.2 :
    yearsExperience < 7 ? 1.0 :
    yearsExperience < 15 ? 0.85 :
    0.75;

  const adjustedHours = round(baseHours * experienceMultiplier);
  const totalLaborCost = round(adjustedHours * hourlyRate);

  return {
    baseHours,
    experienceMultiplier,
    adjustedHours,
    totalLaborCost,
    breakdown: [
      { task: "Remove damaged drywall and prep area", hours: round(adjustedHours * 0.25) },
      { task: "Hang new drywall", hours: round(adjustedHours * 0.35) },
      { task: "Tape, mud, and sand joints", hours: round(adjustedHours * 0.3) },
      { task: "Prime and cleanup", hours: round(adjustedHours * 0.1) },
    ],
    experienceNote: `Labor adjusted using ${yearsExperience} year${yearsExperience === 1 ? "" : "s"} of experience.`,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
