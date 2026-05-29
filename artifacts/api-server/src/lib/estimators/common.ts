function round(value: number) {
  return Math.round(value * 100) / 100;
}

function laborMultiplier(yearsExperience: number) {
  if (yearsExperience < 1) return 1.4;
  if (yearsExperience < 3) return 1.2;
  if (yearsExperience < 7) return 1.0;
  if (yearsExperience < 15) return 0.85;
  return 0.75;
}

export function estimateFlooring({
  areaSqFt,
  hourlyRate = 0,
  yearsExperience = 0,
  includeLabor,
}: {
  areaSqFt: number;
  hourlyRate?: number;
  yearsExperience?: number;
  includeLabor: boolean;
}) {
  const flooringSqFt = Math.ceil(areaSqFt * 1.1);

  const materials = [
    {
      id: "mat-1",
      name: "LVP flooring",
      description: "Luxury vinyl plank flooring",
      category: "Flooring",
      quantity: flooringSqFt,
      unit: "sq ft",
      unitPrice: 3.49,
      totalPrice: round(flooringSqFt * 3.49),
      storeName: "Floor & Decor",
      notes: "Includes 10% waste",
    },
    {
      id: "mat-2",
      name: "Underlayment",
      description: "Moisture barrier underlayment",
      category: "Flooring",
      quantity: areaSqFt,
      unit: "sq ft",
      unitPrice: 0.55,
      totalPrice: round(areaSqFt * 0.55),
      storeName: "Home Depot",
      notes: null,
    },
  ];

  const grandTotal = round(
    materials.reduce((s, m) => s + m.totalPrice, 0)
  );

  const baseHours = round(areaSqFt / 45);
  const adjustedHours = round(
    baseHours * laborMultiplier(yearsExperience)
  );

  return {
    jobSummary: `Flooring installation estimate for ${areaSqFt} sq ft.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: laborMultiplier(yearsExperience),
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Prep floor", hours: round(adjustedHours * 0.2) },
            { task: "Install flooring", hours: round(adjustedHours * 0.6) },
            { task: "Trim and cleanup", hours: round(adjustedHours * 0.2) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} years experience.`,
        }
      : null,
    disclaimer: "Estimate pricing may vary by region.",
  };
}

export function estimateTrim({
  linearFeet,
  hourlyRate = 0,
  yearsExperience = 0,
  includeLabor,
}: {
  linearFeet: number;
  hourlyRate?: number;
  yearsExperience?: number;
  includeLabor: boolean;
}) {
  const trimWaste = Math.ceil(linearFeet * 1.1);

  const materials = [
    {
      id: "mat-1",
      name: "Baseboard trim",
      description: "Primed MDF baseboard trim",
      category: "Trim",
      quantity: trimWaste,
      unit: "linear ft",
      unitPrice: 1.85,
      totalPrice: round(trimWaste * 1.85),
      storeName: "Lowe's",
      notes: "Includes 10% waste",
    },
    {
      id: "mat-2",
      name: "Finish nails",
      description: "16ga finish nails",
      category: "Fasteners",
      quantity: 1,
      unit: "box",
      unitPrice: 12.98,
      totalPrice: 12.98,
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-3",
      name: "Caulk",
      description: "Paintable trim caulk",
      category: "Supplies",
      quantity: Math.max(1, Math.ceil(linearFeet / 120)),
      unit: "tubes",
      unitPrice: 4.98,
      totalPrice: round(Math.ceil(linearFeet / 120) * 4.98),
      storeName: "Lowe's",
      notes: null,
    },
  ];

  const grandTotal = round(
    materials.reduce((s, m) => s + m.totalPrice, 0)
  );

  const baseHours = round(linearFeet / 35);
  const adjustedHours = round(
    baseHours * laborMultiplier(yearsExperience)
  );

  return {
    jobSummary: `Trim installation estimate for ${linearFeet} linear feet.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: laborMultiplier(yearsExperience),
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Cut trim", hours: round(adjustedHours * 0.3) },
            { task: "Install trim", hours: round(adjustedHours * 0.5) },
            { task: "Caulk and cleanup", hours: round(adjustedHours * 0.2) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} years experience.`,
        }
      : null,
    disclaimer: "Estimate pricing may vary by region.",
  };
}

export function estimateFraming({
  wallLengthFt,
  hourlyRate = 0,
  yearsExperience = 0,
  includeLabor,
}: {
  wallLengthFt: number;
  hourlyRate?: number;
  yearsExperience?: number;
  includeLabor: boolean;
}) {
  const studCount = Math.ceil(wallLengthFt / 1.333) + 2;

  const materials = [
    {
      id: "mat-1",
      name: "2x4 studs",
      description: "8 ft framing studs",
      category: "Lumber",
      quantity: studCount,
      unit: "pieces",
      unitPrice: 4.98,
      totalPrice: round(studCount * 4.98),
      storeName: "Home Depot",
      notes: "16 in OC framing",
    },
    {
      id: "mat-2",
      name: "Top/bottom plates",
      description: "2x4 framing plates",
      category: "Lumber",
      quantity: Math.ceil(wallLengthFt / 8) * 2,
      unit: "boards",
      unitPrice: 4.98,
      totalPrice: round(Math.ceil(wallLengthFt / 8) * 2 * 4.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-3",
      name: "Framing nails",
      description: "16d framing nails",
      category: "Fasteners",
      quantity: 1,
      unit: "box",
      unitPrice: 24.98,
      totalPrice: 24.98,
      storeName: "Home Depot",
      notes: null,
    },
  ];

  const grandTotal = round(
    materials.reduce((s, m) => s + m.totalPrice, 0)
  );

  const baseHours = round(wallLengthFt / 8);
  const adjustedHours = round(
    baseHours * laborMultiplier(yearsExperience)
  );

  return {
    jobSummary: `Wall framing estimate for ${wallLengthFt} linear feet.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: laborMultiplier(yearsExperience),
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Layout", hours: round(adjustedHours * 0.2) },
            { task: "Cut lumber", hours: round(adjustedHours * 0.25) },
            { task: "Assemble walls", hours: round(adjustedHours * 0.45) },
            { task: "Cleanup", hours: round(adjustedHours * 0.1) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} years experience.`,
        }
      : null,
    disclaimer: "Estimate pricing may vary by region.",
  };
}
