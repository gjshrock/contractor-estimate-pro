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

export type FlooringType = "hardwood" | "lvp" | "laminate" | "tile";

export function estimateFlooring({
  areaSqFt,
  flooringType = "lvp",
  hourlyRate = 0,
  yearsExperience = 0,
  includeLabor,
}: {
  areaSqFt: number;
  flooringType?: FlooringType;
  hourlyRate?: number;
  yearsExperience?: number;
  includeLabor: boolean;
}) {
  const flooringSqFt = Math.ceil(areaSqFt * 1.1);

  const materials =
    flooringType === "tile"
      ? buildTileFlooringMaterials(areaSqFt, flooringSqFt)
      : buildNonTileFlooringMaterials(areaSqFt, flooringSqFt, flooringType);

  const grandTotal = round(materials.reduce((s, m) => s + m.totalPrice, 0));

  const baseHours = round(
    flooringType === "tile" ? Math.max(8, areaSqFt / 25) : Math.max(4, areaSqFt / 45)
  );

  const multiplier = laborMultiplier(yearsExperience);
  const adjustedHours = round(baseHours * multiplier);

  return {
    jobSummary: `${getFlooringLabel(flooringType)} installation estimate for ${areaSqFt} sq ft.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: multiplier,
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown:
            flooringType === "tile"
              ? [
                  { task: "Prep floor and install backer board", hours: round(adjustedHours * 0.3) },
                  { task: "Set tile with thinset", hours: round(adjustedHours * 0.4) },
                  { task: "Grout tile", hours: round(adjustedHours * 0.2) },
                  { task: "Cleanup and final wipe-down", hours: round(adjustedHours * 0.1) },
                ]
              : [
                  { task: "Prep floor", hours: round(adjustedHours * 0.2) },
                  { task: "Install flooring", hours: round(adjustedHours * 0.6) },
                  { task: "Transitions and cleanup", hours: round(adjustedHours * 0.2) },
                ],
          experienceNote: `Labor adjusted using ${yearsExperience} year${
            yearsExperience === 1 ? "" : "s"
          } experience.`,
        }
      : null,
    disclaimer:
      "Estimate pricing may vary by region. Flooring estimate assumes basic installation with no major subfloor repair, demo, stairs, pattern work, or furniture moving unless specified.",
  };
}

function buildTileFlooringMaterials(areaSqFt: number, flooringSqFt: number) {
  const hardieSheets = Math.ceil(areaSqFt / 15);
  const thinsetBags = Math.max(1, Math.ceil(areaSqFt / 80));
  const groutBags = Math.max(1, Math.ceil(areaSqFt / 250));
  const screwBoxes = Math.max(1, Math.ceil(areaSqFt / 300));

  return [
    {
      id: "mat-1",
      name: "Tile flooring",
      description: "Ceramic or porcelain floor tile",
      category: "Flooring",
      quantity: flooringSqFt,
      unit: "sq ft",
      unitPrice: 2.98,
      totalPrice: round(flooringSqFt * 2.98),
      storeName: "Home Depot",
      notes: "Includes 10% waste",
    },
    {
      id: "mat-2",
      name: "HardieBacker cement board",
      description: "1/4 in. cement backer board for tile flooring",
      category: "Underlayment",
      quantity: hardieSheets,
      unit: "sheets",
      unitPrice: 14.98,
      totalPrice: round(hardieSheets * 14.98),
      storeName: "Lowe's",
      notes: "Assumes wood subfloor",
    },
    {
      id: "mat-3",
      name: "Thinset mortar",
      description: "Polymer-modified thinset mortar",
      category: "Mortar",
      quantity: thinsetBags,
      unit: "bags",
      unitPrice: 18.98,
      totalPrice: round(thinsetBags * 18.98),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-4",
      name: "Grout",
      description: "Sanded grout for tile joints",
      category: "Grout",
      quantity: groutBags,
      unit: "bags",
      unitPrice: 16.98,
      totalPrice: round(groutBags * 16.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-5",
      name: "Tile spacers",
      description: "Reusable tile spacers",
      category: "Supplies",
      quantity: 1,
      unit: "pack",
      unitPrice: 7.98,
      totalPrice: 7.98,
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-6",
      name: "Backer board screws",
      description: "Corrosion-resistant cement board screws",
      category: "Fasteners",
      quantity: screwBoxes,
      unit: "box",
      unitPrice: 12.98,
      totalPrice: round(screwBoxes * 12.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-7",
      name: "Alkali-resistant seam tape",
      description: "Fiberglass tape for cement board seams",
      category: "Supplies",
      quantity: 1,
      unit: "roll",
      unitPrice: 8.98,
      totalPrice: 8.98,
      storeName: "Home Depot",
      notes: null,
    },
  ];
}

function buildNonTileFlooringMaterials(
  areaSqFt: number,
  flooringSqFt: number,
  flooringType: FlooringType
) {
  let flooringName = "LVP flooring";
  let flooringDescription = "Luxury vinyl plank flooring";
  let flooringPrice = 3.49;
  let storeName = "Floor & Decor";
  let underlaymentDescription = "Moisture barrier underlayment";

  if (flooringType === "hardwood") {
    flooringName = "Hardwood flooring";
    flooringDescription = "Prefinished engineered hardwood flooring";
    flooringPrice = 6.98;
    storeName = "Lowe's";
    underlaymentDescription = "Hardwood flooring underlayment / moisture barrier";
  }

  if (flooringType === "laminate") {
    flooringName = "Laminate flooring";
    flooringDescription = "Click-lock laminate flooring";
    flooringPrice = 2.79;
    storeName = "Home Depot";
    underlaymentDescription = "Laminate flooring underlayment";
  }

  const fastenerQuantity = flooringType === "hardwood" ? Math.max(1, Math.ceil(areaSqFt / 400)) : 1;

  return [
    {
      id: "mat-1",
      name: flooringName,
      description: flooringDescription,
      category: "Flooring",
      quantity: flooringSqFt,
      unit: "sq ft",
      unitPrice: flooringPrice,
      totalPrice: round(flooringSqFt * flooringPrice),
      storeName,
      notes: "Includes 10% waste",
    },
    {
      id: "mat-2",
      name: "Underlayment",
      description: underlaymentDescription,
      category: "Flooring",
      quantity: areaSqFt,
      unit: "sq ft",
      unitPrice: 0.55,
      totalPrice: round(areaSqFt * 0.55),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-3",
      name: flooringType === "hardwood" ? "Hardwood flooring cleats" : "Flooring installation spacers",
      description:
        flooringType === "hardwood"
          ? "Flooring cleats/nails for hardwood installation"
          : "Spacers for floating floor installation",
      category: "Fasteners",
      quantity: fastenerQuantity,
      unit: flooringType === "hardwood" ? "box" : "pack",
      unitPrice: flooringType === "hardwood" ? 42.98 : 7.98,
      totalPrice: round(fastenerQuantity * (flooringType === "hardwood" ? 42.98 : 7.98)),
      storeName: "Home Depot",
      notes: flooringType === "hardwood" ? "Estimated fasteners for nail-down hardwood" : null,
    },
    {
      id: "mat-4",
      name: "Flooring transition strips",
      description: "Basic transition strips for doorway/opening edges",
      category: "Flooring",
      quantity: Math.max(1, Math.ceil(areaSqFt / 250)),
      unit: "pieces",
      unitPrice: 18.98,
      totalPrice: round(Math.max(1, Math.ceil(areaSqFt / 250)) * 18.98),
      storeName: "Lowe's",
      notes: null,
    },
  ];
}

function getFlooringLabel(flooringType: FlooringType) {
  if (flooringType === "hardwood") return "Hardwood flooring";
  if (flooringType === "laminate") return "Laminate flooring";
  if (flooringType === "tile") return "Tile flooring";
  return "LVP flooring";
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
  const caulkTubes = Math.max(1, Math.ceil(linearFeet / 120));

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
      quantity: caulkTubes,
      unit: "tubes",
      unitPrice: 4.98,
      totalPrice: round(caulkTubes * 4.98),
      storeName: "Lowe's",
      notes: null,
    },
  ];

  const grandTotal = round(materials.reduce((s, m) => s + m.totalPrice, 0));

  const baseHours = round(Math.max(2, linearFeet / 35));
  const multiplier = laborMultiplier(yearsExperience);
  const adjustedHours = round(baseHours * multiplier);

  return {
    jobSummary: `Trim installation estimate for ${linearFeet} linear feet.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: multiplier,
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Cut trim", hours: round(adjustedHours * 0.3) },
            { task: "Install trim", hours: round(adjustedHours * 0.5) },
            { task: "Caulk and cleanup", hours: round(adjustedHours * 0.2) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} year${
            yearsExperience === 1 ? "" : "s"
          } experience.`,
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
  const plateBoards = Math.ceil(wallLengthFt / 8) * 2;

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
      notes: "16 in. on-center framing",
    },
    {
      id: "mat-2",
      name: "Top/bottom plates",
      description: "2x4 framing plates",
      category: "Lumber",
      quantity: plateBoards,
      unit: "boards",
      unitPrice: 4.98,
      totalPrice: round(plateBoards * 4.98),
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

  const grandTotal = round(materials.reduce((s, m) => s + m.totalPrice, 0));

  const baseHours = round(Math.max(2, wallLengthFt / 8));
  const multiplier = laborMultiplier(yearsExperience);
  const adjustedHours = round(baseHours * multiplier);

  return {
    jobSummary: `Wall framing estimate for ${wallLengthFt} linear feet.`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: multiplier,
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Layout", hours: round(adjustedHours * 0.2) },
            { task: "Cut lumber", hours: round(adjustedHours * 0.25) },
            { task: "Assemble walls", hours: round(adjustedHours * 0.45) },
            { task: "Cleanup", hours: round(adjustedHours * 0.1) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} year${
            yearsExperience === 1 ? "" : "s"
          } experience.`,
        }
      : null,
    disclaimer: "Estimate pricing may vary by region.",
  };
}
