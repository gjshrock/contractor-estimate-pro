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

export function estimateDeck({
  lengthFt,
  widthFt,
  hourlyRate = 0,
  yearsExperience = 0,
  includeLabor,
}: {
  lengthFt: number;
  widthFt: number;
  hourlyRate?: number;
  yearsExperience?: number;
  includeLabor: boolean;
}) {
  const areaSqFt = lengthFt * widthFt;

  const joistSpacingFt = 16 / 12;
  const joistCount = Math.ceil(widthFt / joistSpacingFt) + 1;

  const deckBoardLengthFt = 16;
  const deckBoardCoverageFt = 5.5 / 12;
  const deckBoardsNeeded = Math.ceil(areaSqFt / (deckBoardLengthFt * deckBoardCoverageFt) * 1.1);

  const beamBoards = Math.ceil(lengthFt / 16) * 2;
  const posts = Math.max(4, Math.ceil(areaSqFt / 64));
  const concreteBags = posts * 2;
  const joistHangers = joistCount;
  const screwBoxes = Math.max(2, Math.ceil(areaSqFt / 250));

  const materials = [
    {
      id: "mat-1",
      name: "5/4 x 6 x 16 pressure treated deck boards",
      description: "Pressure treated decking boards",
      category: "Decking",
      quantity: deckBoardsNeeded,
      unit: "boards",
      unitPrice: 13.98,
      totalPrice: round(deckBoardsNeeded * 13.98),
      storeName: "Home Depot",
      notes: "Includes 10% waste factor",
    },
    {
      id: "mat-2",
      name: "2x8x16 pressure treated joists",
      description: "Pressure treated framing joists at 16 in. on center",
      category: "Framing",
      quantity: joistCount,
      unit: "boards",
      unitPrice: 18.98,
      totalPrice: round(joistCount * 18.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-3",
      name: "2x10x16 pressure treated beam boards",
      description: "Built-up beam material",
      category: "Framing",
      quantity: beamBoards,
      unit: "boards",
      unitPrice: 28.98,
      totalPrice: round(beamBoards * 28.98),
      storeName: "Home Depot",
      notes: null,
    },
    {
      id: "mat-4",
      name: "4x4x8 pressure treated posts",
      description: "Deck support posts",
      category: "Framing",
      quantity: posts,
      unit: "posts",
      unitPrice: 13.98,
      totalPrice: round(posts * 13.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-5",
      name: "Concrete mix",
      description: "80 lb bags for post footings",
      category: "Concrete",
      quantity: concreteBags,
      unit: "bags",
      unitPrice: 5.48,
      totalPrice: round(concreteBags * 5.48),
      storeName: "Home Depot",
      notes: "Approx. 2 bags per post",
    },
    {
      id: "mat-6",
      name: "Joist hangers",
      description: "Galvanized joist hangers",
      category: "Hardware",
      quantity: joistHangers,
      unit: "each",
      unitPrice: 1.98,
      totalPrice: round(joistHangers * 1.98),
      storeName: "Lowe's",
      notes: null,
    },
    {
      id: "mat-7",
      name: "Exterior deck screws",
      description: "Coated exterior deck screws",
      category: "Fasteners",
      quantity: screwBoxes,
      unit: "boxes",
      unitPrice: 38.98,
      totalPrice: round(screwBoxes * 38.98),
      storeName: "Home Depot",
      notes: "Estimated screw boxes, not individual screws",
    },
  ];

  const grandTotal = round(materials.reduce((sum, item) => sum + item.totalPrice, 0));

  const baseHours = round(Math.max(12, areaSqFt / 12));
  const adjustedHours = round(baseHours * laborMultiplier(yearsExperience));

  return {
    jobSummary: `Pressure treated wood deck estimate for a ${lengthFt} ft x ${widthFt} ft deck (${areaSqFt} sq ft).`,
    materials,
    grandTotal,
    laborEstimate: includeLabor
      ? {
          baseHours,
          experienceMultiplier: laborMultiplier(yearsExperience),
          adjustedHours,
          totalLaborCost: round(adjustedHours * hourlyRate),
          breakdown: [
            { task: "Layout and footings", hours: round(adjustedHours * 0.2) },
            { task: "Posts, beams, and framing", hours: round(adjustedHours * 0.35) },
            { task: "Install decking boards", hours: round(adjustedHours * 0.3) },
            { task: "Hardware, fastening, and cleanup", hours: round(adjustedHours * 0.15) },
          ],
          experienceNote: `Labor adjusted using ${yearsExperience} years experience.`,
        }
      : null,
    disclaimer:
      "Deck estimate assumes a basic ground-level pressure treated wood deck without stairs, railing, demolition, permits, or site complications unless specified.",
  };
}
