import type { jsPDF as JsPDF } from "jspdf";
import type { NumberCardData } from "@/lib/compute/types";
import { SECTION_KINDS, type SectionKind, type StorySection } from "./types";

/**
 * Builds the three story slides as a real, downloadable PDF — entirely in the browser, so nothing
 * leaves the device. Text stays selectable, and every chart sits beside its exact figures (charts
 * are never the only carrier of meaning — see PLAN.md). Colours match the light theme.
 */

const PAGE = { width: 297, height: 210, margin: 18 }; // A4 landscape, mm

type RGB = [number, number, number];
const SECTION_STYLE: Record<SectionKind, { label: string; color: RGB }> = {
  hook: { label: "1. HOOK", color: [29, 78, 216] },
  line: { label: "2. LINE", color: [126, 34, 206] },
  sinker: { label: "3. SINKER", color: [180, 83, 9] },
};
const DIRECTION_COLOR: Record<NumberCardData["directionMeta"]["color"], RGB> = {
  positive: [21, 128, 61],
  negative: [185, 28, 28],
  neutral: [82, 82, 91],
};
const TEXT: RGB = [23, 23, 23];
const MUTED: RGB = [82, 82, 91];

/** WinAnsi characters beyond Latin-1 that the built-in PDF fonts can draw. */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

/**
 * The PDF's built-in fonts only cover Western European characters. Arrows become words; anything
 * else they can't draw (e.g. emoji) is dropped rather than printed as garbage.
 */
export function pdfSafe(text: string): string {
  return text
    .replace(/\s*→\s*/g, " to ")
    .replace(/↑/g, "up")
    .replace(/↓/g, "down")
    .replace(/[^\n\x20-\xff]/g, (ch) => (WIN_ANSI_EXTRA.includes(ch) ? ch : ""));
}

export function pdfFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "data-story"}.pdf`;
}

function drawSparkline(doc: JsPDF, values: number[], x: number, y: number, w: number, h: number, color: RGB) {
  if (values.length < 2) return;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  for (let i = 1; i < values.length; i++) {
    const px = (j: number) => x + (j / (values.length - 1)) * w;
    const py = (j: number) => y + h - ((values[j] - min) / range) * h;
    doc.line(px(i - 1), py(i - 1), px(i), py(i));
  }
}

/** Largest font size (from `start` down) at which the wrapped text fits in `maxHeight`. */
function fitText(doc: JsPDF, text: string, width: number, maxHeight: number, start: number) {
  for (let size = start; size >= 10; size -= 1) {
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text, width);
    const lineHeight = size * 0.3528 * 1.35; // pt → mm, with line spacing
    if (lines.length * lineHeight <= maxHeight) return { lines, size, lineHeight };
  }
  doc.setFontSize(10);
  const lineHeight = 10 * 0.3528 * 1.35;
  return { lines: doc.splitTextToSize(text, width) as string[], size: 10, lineHeight };
}

export async function buildStoryPdf({
  sections,
  outcome,
  drivers,
  isPractice,
  title,
}: {
  sections: Record<SectionKind, StorySection>;
  outcome?: NumberCardData;
  drivers: NumberCardData[];
  isPractice: boolean;
  title: string;
}): Promise<JsPDF> {
  // Loaded only when someone downloads, so the library isn't in every page's bundle.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setProperties({ title: pdfSafe(title), creator: "Restate" });
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const metrics = [...drivers.map((card) => ({ card, role: "Leading" })), ...(outcome ? [{ card: outcome, role: "Lagging - the result" }] : [])];

  SECTION_KINDS.forEach((kind, index) => {
    if (index > 0) doc.addPage();
    const style = SECTION_STYLE[kind];

    // Accent bar and section label — the label always carries the meaning, colour only reinforces it.
    doc.setFillColor(...style.color);
    doc.rect(0, 0, PAGE.width, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...style.color);
    doc.text(style.label, PAGE.margin, PAGE.margin + 2);

    // Metric rows (Line slide only) sit at the bottom; the text gets whatever space is left.
    const rowHeight = 14;
    const rowsHeight = kind === "line" ? metrics.length * rowHeight + 4 : 0;
    const top = PAGE.margin + 12;
    const bottom = PAGE.height - PAGE.margin - 10 - rowsHeight;

    doc.setFont("helvetica", kind === "hook" ? "bold" : "normal");
    doc.setTextColor(...TEXT);
    const { lines, lineHeight } = fitText(doc, pdfSafe(sections[kind].text), contentWidth, bottom - top, kind === "hook" ? 30 : 20);
    doc.text(lines, PAGE.margin, top + lineHeight * 0.8, { lineHeightFactor: 1.35 });

    if (kind === "line") {
      let y = bottom + 4;
      for (const { card, role } of metrics) {
        const color = DIRECTION_COLOR[card.directionMeta.color];
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.3);
        doc.roundedRect(PAGE.margin, y, contentWidth, rowHeight - 3, 2, 2, "S");
        drawSparkline(doc, card.values, PAGE.margin + 4, y + 2.5, 30, rowHeight - 8, color);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        const textY = y + (rowHeight - 3) / 2 + 1.5;
        doc.text(pdfSafe(card.name), PAGE.margin + 40, textY);
        let x = PAGE.margin + 40 + doc.getTextWidth(pdfSafe(card.name)) + 5;
        doc.setTextColor(...color);
        doc.text(card.directionMeta.word, x, textY);
        x += doc.getTextWidth(card.directionMeta.word) + 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT);
        doc.text(pdfSafe(`${card.formattedFirst} to ${card.formattedLast}`), x, textY);
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text(role.toUpperCase(), PAGE.width - PAGE.margin - 4, textY, { align: "right" });
        y += rowHeight;
      }
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const footerY = PAGE.height - PAGE.margin + 4;
    if (isPractice) doc.text("Practice data - not real numbers", PAGE.margin, footerY);
    doc.text(`Slide ${index + 1} of ${SECTION_KINDS.length}`, PAGE.width - PAGE.margin, footerY, { align: "right" });
  });

  return doc;
}
