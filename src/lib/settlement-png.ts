import { formatMoney } from "@/lib/pocket";

type ClaimRow = { date: string; title: string; amount: number };

export async function downloadSettlementPng(rows: ClaimRow[], category: string, today: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 190 + rows.length * 72;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PNG export unavailable");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillText("미수금 청구 내역", 32, 52);
  ctx.font = "20px system-ui, sans-serif";
  ctx.fillText(`${category} · ${rows.length}건 · ${today} 기준`, 32, 87);
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(`청구 합계 ${formatMoney(rows.reduce((sum, row) => sum + row.amount, 0))}원`, 32, 135);

  rows.forEach((row, index) => {
    const y = 160 + index * 72;
    ctx.fillStyle = "#e5e5e5";
    ctx.fillRect(32, y, 656, 1);
    ctx.fillStyle = "#535353";
    ctx.font = "17px system-ui, sans-serif";
    ctx.fillText(row.date, 32, y + 25);
    ctx.fillStyle = "#111";
    ctx.font = "bold 22px system-ui, sans-serif";
    const amount = `${formatMoney(row.amount)}원`;
    const available = 636 - ctx.measureText(amount).width;
    let title = row.title;
    while (title.length > 1 && ctx.measureText(title + (title === row.title ? "" : "…")).width > available) {
      title = title.slice(0, -1);
    }
    ctx.fillText(title === row.title ? title : title + "…", 32, y + 55);
    ctx.textAlign = "right";
    ctx.fillText(amount, 688, y + 55);
    ctx.textAlign = "left";
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG export failed")), "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `미수금-${today}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
