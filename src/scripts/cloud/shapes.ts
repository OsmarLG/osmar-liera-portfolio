/**
 * Point targets for the hero cloud. Every shape returns exactly `count` points in the
 * same local space: about one unit tall, centred on the origin, z towards the camera.
 *
 * Tones (one float per point) colour the code-drawn shapes:
 *   0..1  teal, from deep to bright
 *   2..3  amber (used sparingly: the pin's "you are here" ring, the approval node)
 */

export interface ShapeTarget {
  positions: Float32Array;
  tones: Float32Array;
}

export interface PortraitSample extends ShapeTarget {
  colors: Float32Array;
  count: number;
}

/** Small deterministic PRNG, so every visit draws the same shapes. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Turns the cut-out portrait into points: one per opaque pixel of a down-scaled copy,
 * with the flat top and bottom edges thinned out like the static photo's mask.
 * Depth comes from luminance plus a gentle bulge, so the bust has volume when it turns.
 */
export function samplePortrait(image: HTMLImageElement, columns: number): PortraitSample | null {
  const width = columns;
  const height = Math.round((columns * image.naturalHeight) / image.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return null;
  }
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const random = createRandom(7);
  const aspect = width / height;

  const positions: number[] = [];
  const colors: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3] / 255;
      if (alpha < 0.45) {
        continue;
      }
      const u = (x + random()) / width;
      const v = (y + random()) / height;
      // Same fade as the photo's mask: solid between 16 % and 80 % of the height.
      if ((v < 0.16 && random() > v / 0.16) || (v > 0.8 && random() > (1 - v) / 0.2)) {
        continue;
      }
      const r = data[index] / 255;
      const g = data[index + 1] / 255;
      const b = data[index + 2] / 255;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const px = (u - 0.5) * aspect;
      const py = 0.5 - v;
      const bulge = 0.16 * Math.sqrt(Math.max(0, 1 - (px / 0.55) ** 2));
      const pz = (luminance - 0.45) * 0.24 + bulge + (random() - 0.5) * 0.012;
      positions.push(px, py, pz);
      colors.push(r, g, b);
    }
  }

  const count = positions.length / 3;
  if (count < 500) {
    return null;
  }
  return {
    count,
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    tones: new Float32Array(count).fill(1),
  };
}

type Point = [number, number, number];

/** Fills `count` points by asking each part for a share of them. */
function compose(count: number, parts: Array<{ share: number; point: (random: () => number) => Point; tone: (random: () => number) => number }>, seed: number): ShapeTarget {
  const random = createRandom(seed);
  const positions = new Float32Array(count * 3);
  const tones = new Float32Array(count);
  const total = parts.reduce((sum, part) => sum + part.share, 0);
  let written = 0;
  parts.forEach((part, partIndex) => {
    const amount = partIndex === parts.length - 1 ? count - written : Math.round((part.share / total) * count);
    for (let i = 0; i < amount && written < count; i += 1) {
      const [x, y, z] = part.point(random);
      positions[written * 3] = x;
      positions[written * 3 + 1] = y;
      positions[written * 3 + 2] = z;
      tones[written] = part.tone(random);
      written += 1;
    }
  });
  // Shuffle so neighbouring indices (and their stagger seeds) are spread across parts.
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    for (let k = 0; k < 3; k += 1) {
      const swap = positions[i * 3 + k];
      positions[i * 3 + k] = positions[j * 3 + k];
      positions[j * 3 + k] = swap;
    }
    const swapTone = tones[i];
    tones[i] = tones[j];
    tones[j] = swapTone;
  }
  return { positions, tones };
}

/** A point on a thick segment from a to b. */
function onSegment(random: () => number, a: [number, number], b: [number, number], thickness: number, depth: number): Point {
  const t = random();
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const offset = (random() - 0.5) * thickness;
  return [a[0] + dx * t - (dy / length) * offset, a[1] + dy * t + (dx / length) * offset, (random() - 0.5) * depth];
}

/** Terminal window with the prompt chevron and the block caret of the hero. */
export function terminalShape(count: number): ShapeTarget {
  const w = 1.25;
  const h = 0.86;
  const perimeter = (random: () => number): Point => {
    const along = random() * 2 * (w + h);
    const jitter = (random() - 0.5) * 0.012;
    let x: number;
    let y: number;
    if (along < w) {
      x = -w / 2 + along;
      y = h / 2;
    } else if (along < w + h) {
      x = w / 2;
      y = h / 2 - (along - w);
    } else if (along < 2 * w + h) {
      x = w / 2 - (along - w - h);
      y = -h / 2;
    } else {
      x = -w / 2;
      y = -h / 2 + (along - 2 * w - h);
    }
    return [x + jitter, y + jitter, (random() - 0.5) * 0.04];
  };
  return compose(
    count,
    [
      { share: 15, point: perimeter, tone: () => 0.35 },
      { share: 4, point: (r) => onSegment(r, [-w / 2, h / 2 - 0.13], [w / 2, h / 2 - 0.13], 0.008, 0.03), tone: () => 0.3 },
      {
        share: 3,
        point: (r) => {
          const dot = Math.floor(r() * 3);
          const angle = r() * Math.PI * 2;
          const radius = Math.sqrt(r()) * 0.026;
          return [-w / 2 + 0.08 + dot * 0.075 + Math.cos(angle) * radius, h / 2 - 0.065 + Math.sin(angle) * radius, 0];
        },
        tone: () => 0.55,
      },
      // Prompt chevron "›".
      { share: 19, point: (r) => onSegment(r, [-0.44, 0.13], [-0.2, -0.04], 0.075, 0.12), tone: (r) => 0.75 + r() * 0.25 },
      { share: 19, point: (r) => onSegment(r, [-0.2, -0.04], [-0.44, -0.21], 0.075, 0.12), tone: (r) => 0.75 + r() * 0.25 },
      // Block caret.
      {
        share: 26,
        point: (r) => [-0.08 + r() * 0.15, -0.23 + r() * 0.36, (r() - 0.5) * 0.14],
        tone: (r) => 0.85 + r() * 0.15,
      },
      // Two faint log lines to the right of the caret.
      { share: 7, point: (r) => onSegment(r, [0.16, 0.06], [0.5, 0.06], 0.02, 0.03), tone: () => 0.45 },
      { share: 7, point: (r) => onSegment(r, [0.16, -0.06], [0.4, -0.06], 0.02, 0.03), tone: () => 0.4 },
    ],
    11,
  );
}

/** Map pin of La Paz with a "you are here" ripple on the ground. */
export function pinShape(count: number): ShapeTarget {
  const headY = 0.2;
  const headR = 0.26;
  const tipY = -0.46;
  const inPin = (x: number, y: number): boolean => {
    const dHead = Math.hypot(x, y - headY);
    if (dHead < 0.095) {
      return false;
    }
    if (dHead <= headR) {
      return true;
    }
    if (y < headY && y > tipY) {
      const t = (y - tipY) / (headY - tipY);
      return Math.abs(x) < headR * 0.93 * Math.pow(t, 0.85);
    }
    return false;
  };
  const body = (random: () => number): Point => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const x = (random() - 0.5) * headR * 2;
      const y = tipY + random() * (headY + headR - tipY);
      if (inPin(x, y)) {
        const thickness = 0.1 * (0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - (x / headR) ** 2)));
        return [x, y + 0.04, (random() - 0.5) * thickness * 2];
      }
    }
    return [0, headY, 0];
  };
  const ring = (radius: number) => (random: () => number): Point => {
    const angle = random() * Math.PI * 2;
    const spread = radius + (random() - 0.5) * 0.02;
    return [Math.cos(angle) * spread, tipY + 0.03, Math.sin(angle) * spread * 0.9];
  };
  return compose(
    count,
    [
      { share: 66, point: body, tone: (r) => 0.6 + r() * 0.4 },
      { share: 10, point: ring(0.16), tone: (r) => 2.55 + r() * 0.35 },
      { share: 13, point: ring(0.36), tone: () => 0.4 },
      { share: 11, point: ring(0.58), tone: () => 0.22 },
    ],
    23,
  );
}

/** A small agent/tool graph: a hub, eight nodes and the links between them. */
export function graphShape(count: number): ShapeTarget {
  const nodes: Array<{ p: Point; r: number; amber?: boolean }> = [
    { p: [0, 0, 0], r: 0.085 },
    { p: [-0.44, 0.24, 0.12], r: 0.05 },
    { p: [0.4, 0.3, -0.14], r: 0.055 },
    { p: [0.48, -0.16, 0.16], r: 0.045, amber: true },
    { p: [-0.32, -0.32, -0.16], r: 0.05 },
    { p: [0.06, 0.47, 0.2], r: 0.04 },
    { p: [-0.04, -0.48, 0.1], r: 0.045 },
    { p: [-0.58, -0.04, -0.26], r: 0.04 },
    { p: [0.2, 0.04, 0.44], r: 0.04 },
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [0, 8],
    [1, 7],
    [1, 5],
    [2, 5],
    [2, 3],
    [4, 7],
    [4, 6],
    [3, 8],
    [6, 3],
  ];
  const nodePoint = (random: () => number): Point => {
    // The hub gets more points than the leaves.
    const index = random() < 0.24 ? 0 : 1 + Math.floor(random() * (nodes.length - 1));
    const node = nodes[index];
    const u = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const radius = node.r * (0.85 + random() * 0.15);
    return [node.p[0] + s * Math.cos(angle) * radius, node.p[1] + s * Math.sin(angle) * radius, node.p[2] + u * radius];
  };
  const edgePoint = (random: () => number): Point => {
    const [a, b] = edges[Math.floor(random() * edges.length)];
    const t = random();
    const from = nodes[a].p;
    const to = nodes[b].p;
    const jitter = (): number => (random() - 0.5) * 0.008;
    return [from[0] + (to[0] - from[0]) * t + jitter(), from[1] + (to[1] - from[1]) * t + jitter(), from[2] + (to[2] - from[2]) * t + jitter()];
  };
  const amberNode = nodes.find((node) => node.amber)!;
  return compose(
    count,
    [
      { share: 44, point: nodePoint, tone: (r) => 0.8 + r() * 0.2 },
      {
        share: 4,
        point: (random) => {
          const u = random() * 2 - 1;
          const angle = random() * Math.PI * 2;
          const s = Math.sqrt(1 - u * u);
          const radius = amberNode.r * (0.85 + random() * 0.2);
          return [amberNode.p[0] + s * Math.cos(angle) * radius, amberNode.p[1] + s * Math.sin(angle) * radius, amberNode.p[2] + u * radius];
        },
        tone: (r) => 2.7 + r() * 0.3,
      },
      { share: 52, point: edgePoint, tone: (r) => 0.25 + r() * 0.25 },
    ],
    37,
  );
}
