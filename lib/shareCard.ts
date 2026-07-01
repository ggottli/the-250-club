export function generateShareCardDataUrl(groupName: string, total: number, goal: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a1a3c");
  gradient.addColorStop(1, "#060f24");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // scattered stars for texture
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.textAlign = "center";

  ctx.font = "120px system-ui, -apple-system, sans-serif";
  ctx.fillText("🦅🎆", canvas.width / 2, 260);

  const achieved = total >= goal;

  ctx.fillStyle = "#f4b942";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  wrapText(ctx, groupName, canvas.width / 2, 420, 900, 70);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 90px system-ui, -apple-system, sans-serif";
  ctx.fillText(achieved ? "LIBERTY ACHIEVED" : `${total} / ${goal} BEERS`, canvas.width / 2, 620);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "44px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    achieved ? `${total} beers. Mission complete.` : "The 250 Club",
    canvas.width / 2,
    700
  );

  ctx.fillStyle = "#b31942";
  ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
  ctx.fillText("🇺🇸 THE 250 CLUB 🇺🇸", canvas.width / 2, canvas.height - 80);

  return canvas.toDataURL("image/png");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cursorY);
}
