export type PaintingEstimateInput = {
  wallAreaSqFt: number;
  coats?: number;
  includeLabor: boolean;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
};

export function estimatePainting(input: PaintingEstimateInput) {
  const area = input.wallAreaSqFt;
  const coats = input.coats ?? 2;

  const paintCoveragePerGallon = 350;
  const primerCoveragePerGallon = 300;

  const primerGallons = Math.max(1, Math.ceil(area / primerCoveragePerGallon));
  const paintGallons = Math.max(
    1,
    Math.ceil((area * coats) / paintCoveragePerGallon)
  );

  const tapeRolls = Math.max(1, Math.ceil(area / 500));
  const plasticRolls = Math.max(1, Math.ceil(area / 800));
  const rollerKits = Math.max(1, Math.ceil(area / 1000));

  const materials = [
    {
      id: "mat-1",
      name: "Interior wall paint",
      description: "Premium interior latex wall paint",
      category: "Paint",
      quantity: paintGallons,
      unit: "gallons",
      unitPrice: 42.98,
      totalPrice: round(paintGallons * 42.98),
      storeName: "Sherwin-Williams",
      notes: `${coats} coat application`,
    },
    {
      id: "mat-2",
      name: "Primer",
      description: "Interior drywall/stain blocking primer",
      category: "Paint",
      quantity: primerGallons,
      unit: "gallons",
      unitPrice: 24.98,
      totalPrice: round(primerGallons * 24.98),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-3",
      name: "Painter's tape",
      description: "Multi-surface masking tape",
      category: "Supplies",
      quantity: tapeRolls,
      unit: "rolls",
      unitPrice: 6.98,
      totalPrice: round(tapeRolls * 6.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-4",
      name: "Plastic sheeting",
      description: "Protective plastic drop sheeting",
      category: "Supplies",
      quantity: plasticRolls,
      unit: "rolls",
      unitPrice: 12.98,
      totalPrice: round(plasticRolls * 12.98),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-5",
      name: "Roller kit",
      description: "Roller frame, covers, and tray",
      category: "Supplies",
      quantity: rollerKits,
      unit: "kits",
      unitPrice: 18.98,
      totalPrice: round(rollerKits * 18.98),
      storeName: "Lowe's",
      notes: null,
    },
  ];

  const grandTotal = round(
    materials.reduce((sum, item) => sum + item.totalPrice, 0)
  );

  const laborEstimate = input.includeLabor
    ? buildPaintingLabor(
        area,
        coats,
        input.hourlyRate ?? 0,
        input.yearsExperience ?? 0
      )
    : null;

  return {
    jobSummary: `Interior painting estimate for approximately ${area} sq ft with ${coats} coats.`,
    materials,
    grandTotal,
    laborEstimate,
    disclaimer:
      "Prices are estimates based on typical retail pricing and may vary by region and availability.",
  };
}

function buildPaintingLabor(
  areaSqFt: number,
  coats: number,
  hourlyRate: number,
  yearsExperience: number
) {
  const baseHours = round(Math.max(3, (areaSqFt / 150) * coats));

  const experienceMultiplier =
    yearsExperience < 1
      ? 1.4
      : yearsExperience < 3
      ? 1.2
      : yearsExperience < 7
      ? 1.0
      : yearsExperience < 15
      ? 0.85
      : 0.75;

  const adjustedHours = round(baseHours * experienceMultiplier);

  return {
    baseHours,
    experienceMultiplier,
    adjustedHours,
    totalLaborCost: round(adjustedHours * hourlyRate),
    breakdown: [
      {
        task: "Prep and masking",
        hours: round(adjustedHours * 0.25),
      },
      {
        task: "Primer coat",
        hours: round(adjustedHours * 0.2),
      },
      {
        task: "Paint application",
        hours: round(adjustedHours * 0.45),
      },
      {
        task: "Cleanup and touch-up",
        hours: round(adjustedHours * 0.1),
      },
    ],
    experienceNote: `Labor adjusted using ${yearsExperience} year${
      yearsExperience === 1 ? "" : "s"
    } of experience.`,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
