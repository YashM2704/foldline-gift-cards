import { Path, Rect, Svg } from "@hyper-elements/react";
import qrcode from "qrcode-generator";

/** A QR code as one Svg path: a square module per dark cell, with the quiet zone scanners need around it. */
export function Qr({ value, size, color, background = "#FFFFFF", title }: { value: string; size: number; color: string; background?: string; title: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  const quiet = 4; // modules of quiet zone, as the QR spec asks
  return (
    <Svg width={size} height={size} viewBox={`${-quiet} ${-quiet} ${n + 2 * quiet} ${n + 2 * quiet}`} title={title}>
      <Rect x={-quiet} y={-quiet} width={n + 2 * quiet} height={n + 2 * quiet} style={{ fill: background }} />
      <Path d={d} style={{ fill: color }} />
    </Svg>
  );
}
