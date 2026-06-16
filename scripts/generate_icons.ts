import sharp from "sharp";
import { resolve } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const svgContent = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="rgba(255,255,255,0.8)"/>
    </filter>
  </defs>

  <g filter="url(#glow)">
    <g transform="translate(16, 16)">
      <rect x="14.4" y="4.8" width="67.2" height="81.6" rx="11.52" fill="#4285f4" filter="url(#shadow)"/>
      <rect x="14.4" y="4.8" width="67.2" height="24" rx="11.52" fill="rgba(255,255,255,0.2)"/>
      <rect x="4.8" y="24" width="86.4" height="62.4" rx="11.52" fill="#34a853" filter="url(#shadow)"/>
      <rect x="4.8" y="24" width="86.4" height="24" rx="11.52" fill="rgba(255,255,255,0.2)"/>
      <rect x="0" y="43.2" width="96" height="43.2" rx="11.52" fill="#fbbc04" filter="url(#shadow)"/>
      <rect x="0" y="43.2" width="96" height="24" rx="11.52" fill="rgba(255,255,255,0.2)"/>
      <circle cx="14.4" cy="55.2" r="4.8" fill="#ffffff" />
      <rect x="24" y="51.36" width="38.4" height="7.68" rx="3.84" fill="#ffffff" />
    </g>
  </g>
</svg>
`;

async function generateIcons() {
  const sizes = [16, 32, 48, 128];
  const outDir = resolve(process.cwd(), "src", "icons");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log("🎨 Generating Chrome Extension icons...");

  for (const size of sizes) {
    const outFile = resolve(outDir, `icon_${size}.png`);
    await sharp(Buffer.from(svgContent)).resize(size, size).png().toFile(outFile);

    console.log(`✅ Generated ${size}x${size} -> src/icons/icon_${size}.png`);
  }
}

generateIcons().catch((err) => {
  console.error("❌ Failed to generate icons:", err);
  process.exit(1);
});
