export type CreditWord = {
  text: string;
  width: number;
  tokenIndex: number;
};

export type CreditLine = {
  words: CreditWord[];
  width: number;
  y: number;
};

export type PlacedWord = {
  copyIndex: number;
  tokenIndex: number;
  text: string;
  x: number;
  y: number;
};

export type CircleMetrics = {
  x: number;
  y: number;
  radius: number;
};

export type LayoutMetrics = {
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  pagePad: number;
  lineHeight: number;
  spaceWidth: number;
  loopGap: number;
  allowSideOverflow: boolean;
};

const BLEND_PX = 16;

export function measureString(
  context: CanvasRenderingContext2D,
  text: string,
): number {
  return context.measureText(text).width;
}

export function flattenCreditWords(paragraphs: string[], endLabel: string): string[] {
  const words: string[] = [];
  for (const paragraph of paragraphs) {
    words.push(...paragraph.split(/\s+/).filter(Boolean));
  }
  words.push(...endLabel.split(/\s+/).filter(Boolean));
  return words;
}

export function buildCreditLines(
  paragraphs: string[],
  endLabel: string,
  measure: (text: string) => number,
  contentWidth: number,
  lineHeight: number,
  spaceWidth: number,
  paragraphGap: number,
): CreditLine[] {
  const lines: CreditLine[] = [];
  let y = 0;
  let tokenIndex = 0;

  function pushParagraph(text: string) {
    const words = text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const token = { text: word, width: measure(word), tokenIndex };
        tokenIndex += 1;
        return token;
      });

    let current: CreditWord[] = [];
    let used = 0;

    function commit() {
      if (current.length === 0) {
        return;
      }

      lines.push({ words: current, width: used, y });
      y += lineHeight;
      current = [];
      used = 0;
    }

    for (const word of words) {
      const extra = current.length > 0 ? spaceWidth : 0;
      if (current.length > 0 && used + extra + word.width > contentWidth) {
        commit();
      }
      used += (current.length > 0 ? spaceWidth : 0) + word.width;
      current.push(word);
    }

    commit();
    y += paragraphGap;
  }

  for (const paragraph of paragraphs) {
    pushParagraph(paragraph);
  }

  pushParagraph(endLabel);
  return lines;
}

export function copyHeightOf(lines: CreditLine[], lineHeight: number, loopGap: number): number {
  if (lines.length === 0) {
    return loopGap;
  }

  const last = lines[lines.length - 1];
  return last.y + lineHeight + loopGap;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 <= edge0) {
    return value >= edge1 ? 1 : 0;
  }

  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function splitIndexFor(line: CreditLine, spaceWidth: number): number {
  if (line.words.length <= 1) {
    return 1;
  }

  let best = 1;
  let bestDelta = Number.POSITIVE_INFINITY;
  let used = 0;

  for (let index = 1; index < line.words.length; index += 1) {
    used += (index > 1 ? spaceWidth : 0) + line.words[index - 1].width;
    const delta = Math.abs(used - line.width / 2);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = index;
    }
  }

  return best;
}

function groupWidth(
  words: CreditWord[],
  spaceWidth: number,
): number {
  if (words.length === 0) {
    return 0;
  }

  return words.reduce((sum, word) => sum + word.width, 0) + spaceWidth * (words.length - 1);
}

function halfGapAt(lineCenterY: number, circle: CircleMetrics): number {
  const dy = lineCenterY - circle.y;
  const inside = circle.radius * circle.radius - dy * dy;
  if (inside <= 0) {
    return 0;
  }

  return Math.sqrt(inside);
}

export function placeCreditWords(
  lines: CreditLine[],
  scrollOffset: number,
  copies: number,
  circle: CircleMetrics,
  metrics: LayoutMetrics,
): PlacedWord[] {
  const height = copyHeightOf(lines, metrics.lineHeight, metrics.loopGap);
  const placed: PlacedWord[] = [];
  const contentLeft = (metrics.viewportWidth - metrics.contentWidth) / 2;
  const viewPad = metrics.lineHeight * 2;

  for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
    const copyShift = copyIndex * height - scrollOffset;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const y = line.y + copyShift;
      if (y + metrics.lineHeight < -viewPad || y > metrics.viewportHeight + viewPad) {
        continue;
      }

      const lineCenterY = y + metrics.lineHeight / 2;
      const gap = halfGapAt(lineCenterY, circle);
      const blend = smoothstep(0, BLEND_PX, gap);
      const centeredStart = contentLeft + (metrics.contentWidth - line.width) / 2;
      const splitAt = splitIndexFor(line, metrics.spaceWidth);
      const leftWords = line.words.slice(0, splitAt);
      const leftWidth = groupWidth(leftWords, metrics.spaceWidth);
      const innerLeft = circle.x - gap;
      const innerRight = circle.x + gap;
      const splitLeftStart = innerLeft - metrics.spaceWidth / 2 - leftWidth;
      const splitRightStart = innerRight + metrics.spaceWidth / 2;

      let cursor = 0;
      for (let wordIndex = 0; wordIndex < line.words.length; wordIndex += 1) {
        const word = line.words[wordIndex];
        const centeredX = centeredStart + cursor;
        let splitX = centeredX;

        if (line.words.length === 1) {
          const naturalCenter = centeredX + word.width / 2;
          splitX =
            naturalCenter <= circle.x
              ? innerLeft - word.width
              : innerRight;
        } else if (wordIndex < splitAt) {
          splitX = splitLeftStart + cursor;
        } else {
          const offsetInRight =
            cursor - leftWidth - (leftWords.length > 0 ? metrics.spaceWidth : 0);
          splitX = splitRightStart + offsetInRight;
        }

        const target = splitX * blend + centeredX * (1 - blend);
        let x = target;
        if (!metrics.allowSideOverflow) {
          const minX = metrics.pagePad;
          const maxX = metrics.viewportWidth - metrics.pagePad - word.width;
          x = Math.min(maxX, Math.max(minX, target));
        }

        placed.push({
          copyIndex,
          tokenIndex: word.tokenIndex,
          text: word.text,
          x,
          y,
        });

        cursor += word.width + metrics.spaceWidth;
      }
    }
  }

  return placed;
}
