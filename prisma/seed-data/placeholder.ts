/**
 * Generates a deterministic SVG "photo" placeholder for seed/demo product
 * media — a color swatch labeled with the product + color name. This is
 * explicitly demo content standing in for real product photography /
 * garment renders, not a simulation of a working feature.
 */
export function placeholderProductImage(params: {
  hex: string;
  productName: string;
  colorName: string;
  width?: number;
  height?: number;
}): string {
  const { hex, productName, colorName, width = 900, height = 1125 } = params;
  const textColor = isLight(hex) ? "#141311" : "#F5F3EE";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${hex}" />
    <rect x="0" y="0" width="${width}" height="${height}" fill="black" opacity="0.03" />
    <text x="${width / 2}" y="${height - 90}" font-family="Georgia, serif" font-size="34" fill="${textColor}" text-anchor="middle">${escapeXml(productName)}</text>
    <text x="${width / 2}" y="${height - 50}" font-family="Arial, sans-serif" font-size="18" letter-spacing="3" fill="${textColor}" opacity="0.75" text-anchor="middle">${escapeXml(colorName.toUpperCase())}</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (ch) => {
    switch (ch) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return ch;
    }
  });
}
