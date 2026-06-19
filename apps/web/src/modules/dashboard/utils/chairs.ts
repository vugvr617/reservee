// Chair layout shared between the Konva edit canvas and the HTML read-only view.

// Chair dimensions (world units, matching table coordinates)
export const CHAIR_THICKNESS = 12; // How thick the chair is (perpendicular to table edge)
export const CHAIR_GAP = 8; // Distance from table edge
export const CHAIR_SPACING = 6; // Gap between adjacent chairs on the same side

export interface ChairRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Calculate chair positions and dimensions based on capacity
export function calculateChairPositions(
  capacity: number,
  tableWidth: number,
  tableHeight: number,
  _shape: "square" | "round" | "rectangular" | "oval"
): ChairRect[] {
  const positions: ChairRect[] = [];

  if (capacity <= 0) return positions;

  const isHorizontal = tableWidth >= tableHeight;

  // Determine how many chairs per side
  let topCount = 0, rightCount = 0, bottomCount = 0, leftCount = 0;

  if (capacity === 1) {
    topCount = 1;
  } else if (capacity === 2) {
    leftCount = 1;
    rightCount = 1;
  } else if (capacity === 3) {
    topCount = 1;
    leftCount = 1;
    rightCount = 1;
  } else if (capacity === 4) {
    topCount = 1;
    rightCount = 1;
    bottomCount = 1;
    leftCount = 1;
  } else if (capacity === 5) {
    topCount = 2;
    bottomCount = 2;
    leftCount = 1;
  } else if (capacity === 6) {
    if (isHorizontal) {
      topCount = 3;
      bottomCount = 3;
    } else {
      leftCount = 3;
      rightCount = 3;
    }
  } else if (capacity === 8) {
    topCount = 2;
    rightCount = 2;
    bottomCount = 2;
    leftCount = 2;
  } else {
    // For other capacities, distribute evenly
    const perSide = Math.ceil(capacity / 4);
    topCount = bottomCount = leftCount = rightCount = perSide;
  }

  // Top chairs
  if (topCount > 0) {
    const chairWidth = (tableWidth - CHAIR_SPACING * (topCount - 1)) / topCount;
    for (let i = 0; i < topCount; i++) {
      const x = i * (chairWidth + CHAIR_SPACING);
      positions.push({ x, y: -CHAIR_GAP - CHAIR_THICKNESS, width: chairWidth, height: CHAIR_THICKNESS, rotation: 0 });
    }
  }

  // Bottom chairs
  if (bottomCount > 0) {
    const chairWidth = (tableWidth - CHAIR_SPACING * (bottomCount - 1)) / bottomCount;
    for (let i = 0; i < bottomCount; i++) {
      const x = i * (chairWidth + CHAIR_SPACING);
      positions.push({ x, y: tableHeight + CHAIR_GAP, width: chairWidth, height: CHAIR_THICKNESS, rotation: 0 });
    }
  }

  // Left chairs
  if (leftCount > 0) {
    const chairHeight = (tableHeight - CHAIR_SPACING * (leftCount - 1)) / leftCount;
    for (let i = 0; i < leftCount; i++) {
      const y = i * (chairHeight + CHAIR_SPACING);
      positions.push({ x: -CHAIR_GAP - CHAIR_THICKNESS, y, width: CHAIR_THICKNESS, height: chairHeight, rotation: 0 });
    }
  }

  // Right chairs
  if (rightCount > 0) {
    const chairHeight = (tableHeight - CHAIR_SPACING * (rightCount - 1)) / rightCount;
    for (let i = 0; i < rightCount; i++) {
      const y = i * (chairHeight + CHAIR_SPACING);
      positions.push({ x: tableWidth + CHAIR_GAP, y, width: CHAIR_THICKNESS, height: chairHeight, rotation: 0 });
    }
  }

  return positions;
}
