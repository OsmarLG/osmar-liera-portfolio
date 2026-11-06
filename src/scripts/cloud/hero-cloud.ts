/**
 * Signature hero: Osmar's portrait as an interactive point cloud (three.js).
 *
 * - The static photo is the LCP element and stays in the layout. Once the cloud has drawn
 *   its first frame, the photo cross-fades into the points; if anything fails, the photo
 *   simply stays.
 * - One full-viewport canvas sits behind the content (pointer-events: none). Sections marked
 *   with [data-cloud-shape] are the stops: between them the points disperse into a "trace"
 *   data stream and re-form into the next shape (terminal, La Paz pin, agent graph).
 * - The pointer repels the points and turns the cloud a few degrees.
 * - DPR ≤ 1.5, fewer points on small/touch screens, no rendering when the tab is hidden or
 *   the cloud is fully transparent, everything disposed on pagehide.
 */
import { BufferAttribute, BufferGeometry, NormalBlending, PerspectiveCamera, Points, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from 'three';
import { createRandom, graphShape, pinShape, samplePortrait, terminalShape } from './shapes';

const SHAPE_IDS: Record<string, number> = { portrait: 0, cursor: 1, pin: 2, graph: 3 };
const FOV = 35;
const CAMERA_Z = 6;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFrom;
  uniform float uTo;
  uniform float uT;
  uniform float uIntro;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uAspect;
  uniform float uOpacity;
  uniform float uStreamWidth;
  uniform float uMouseStrength;
  uniform float uRadius;
  uniform float uPush;
  uniform vec2 uMouse;
  uniform vec3 uDeep;
  uniform vec3 uAccent;
  uniform vec3 uAmber;

  attribute vec3 aCursor;
  attribute vec3 aPin;
  attribute vec3 aGraph;
  attribute vec3 aColor;
  attribute vec3 aTones;
  attribute vec4 aRand;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 shapePosition(float id) {
    if (id < 0.5) return position;
    if (id < 1.5) return aCursor;
    if (id < 2.5) return aPin;
    return aGraph;
  }

  vec3 toneColor(float tone) {
    if (tone > 1.5) return uAmber * (0.55 + (tone - 2.0) * 0.6);
    return mix(uDeep, uAccent, tone);
  }

  vec3 shapeColor(float id) {
    if (id < 0.5) return aColor;
    if (id < 1.5) return toneColor(aTones.x);
    if (id < 2.5) return toneColor(aTones.y);
    return toneColor(aTones.z);
  }

  /* Horizontal lanes of points flowing left to right: the "trace" between sections. */
  vec3 streamPosition() {
    float lane = floor(aRand.y * 7.0);
    float speed = 0.03 + aRand.w * 0.05;
    float x = (fract(aRand.z + uTime * speed) - 0.5) * uStreamWidth;
    float y = (lane - 3.0) * 0.07 + sin(x * 2.6 + uTime * 0.8 + lane * 1.7) * 0.035 + (aRand.x - 0.5) * 0.018;
    return vec3(x, y, (aRand.w - 0.5) * 0.3);
  }

  void main() {
    float local = clamp((uT - aRand.x * 0.4) / 0.6, 0.0, 1.0);
    float eased = local * local * (3.0 - 2.0 * local);
    vec3 pos = mix(shapePosition(uFrom), shapePosition(uTo), eased);

    float stream = sin(eased * 3.14159265);
    float intro = clamp((uIntro - aRand.y * 0.45) / 0.55, 0.0, 1.0);
    intro = 1.0 - pow(1.0 - intro, 3.0);
    stream = max(stream, 1.0 - intro);

    /* Idle breathing. */
    pos *= 1.0 + sin(uTime * 1.1) * 0.012;
    pos += 0.0045 * vec3(sin(uTime * 1.7 + aRand.z * 6.2831), cos(uTime * 1.3 + aRand.w * 6.2831), sin(uTime + aRand.x * 6.2831));
    pos = mix(pos, streamPosition(), stream);

    vec3 color = mix(shapeColor(uFrom), shapeColor(uTo), eased);
    color = mix(color, uAccent * (0.55 + aRand.z * 0.55), stream * 0.85);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 delta = (clip.xy / clip.w - uMouse) * vec2(uAspect, 1.0);
    float push = (1.0 - smoothstep(0.0, uRadius, length(delta))) * uMouseStrength;
    mv.xy += normalize(delta + vec2(0.0001)) * push * uPush * (-mv.z);
    mv.z += push * 0.25;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPointSize * (0.65 + aRand.w * 0.7) * mix(1.0, 0.8, stream) * uPixelRatio;
    vColor = color + push * 0.18;
    vAlpha = uOpacity * mix(1.0, 0.7, stream);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.12, d) * vAlpha);
  }
`;

interface Stop {
  element: HTMLElement;
  shape: number;
  /** Box the shape is drawn in: the photo, a [data-cloud-target] or, without one, a side slot. */
  target: HTMLElement | null;
  portrait: boolean;
  opacity: number;
}

interface Key {
  at: number;
  p: number;
}

interface Anchor {
  x: number;
  y: number;
  size: number;
  /** 0..1: how far the content has scrolled past the shape's sticky spot. */
  past: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => t * t * (3 - 2 * t);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('portrait failed to load'));
    image.src = src;
  });
}

export interface HeroCloud {
  dispose: () => void;
}

export async function mountHeroCloud(hero: HTMLElement): Promise<HeroCloud | null> {
  const portrait = hero.querySelector<HTMLElement>('[data-cloud-anchor]');
  const photo = portrait?.querySelector<HTMLElement>('picture');
  const source = portrait?.dataset.cloudSrc;
  if (!portrait || !photo || !source) {
    return null;
  }

  const small = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
  const columns = small ? 104 : lowPower ? 132 : 168;

  const image = await loadImage(source);
  const sample = samplePortrait(image, columns);
  if (!sample) {
    return null;
  }
  const count = sample.count;
  const rows = Math.round((columns * image.naturalHeight) / image.naturalWidth);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power', premultipliedAlpha: false });
  } catch {
    return null;
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero-cloud';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.z = CAMERA_Z;

  const cursor = terminalShape(count);
  const pin = pinShape(count);
  const graph = graphShape(count);
  const random = createRandom(101);
  const seeds = new Float32Array(count * 4);
  const tones = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    seeds[i * 4] = random();
    seeds[i * 4 + 1] = random();
    seeds[i * 4 + 2] = random();
    seeds[i * 4 + 3] = random();
    tones[i * 3] = cursor.tones[i];
    tones[i * 3 + 1] = pin.tones[i];
    tones[i * 3 + 2] = graph.tones[i];
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(sample.positions, 3));
  geometry.setAttribute('aCursor', new BufferAttribute(cursor.positions, 3));
  geometry.setAttribute('aPin', new BufferAttribute(pin.positions, 3));
  geometry.setAttribute('aGraph', new BufferAttribute(graph.positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(sample.colors, 3));
  geometry.setAttribute('aTones', new BufferAttribute(tones, 3));
  geometry.setAttribute('aRand', new BufferAttribute(seeds, 4));

  const uniforms = {
    uTime: { value: 0 },
    uFrom: { value: 0 },
    uTo: { value: 0 },
    uT: { value: 0 },
    uIntro: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uPointSize: { value: 2 },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uOpacity: { value: 0 },
    uStreamWidth: { value: 3 },
    uMouseStrength: { value: 0 },
    uRadius: { value: small ? 0.32 : 0.22 },
    uPush: { value: 0.07 * Math.tan(((FOV / 2) * Math.PI) / 180) },
    uMouse: { value: new Vector2(10, 10) },
    uDeep: { value: new Vector3(0.05, 0.36, 0.44) },
    uAccent: { value: new Vector3(0.37, 0.88, 0.96) },
    uAmber: { value: new Vector3(1, 0.77, 0.42) },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  // ---- Layout: stops, stream sections and dimmed sections, measured in document pixels.
  const stops: Stop[] = [...document.querySelectorAll<HTMLElement>('[data-cloud-shape]')].map((element) => {
    const isPortrait = element.contains(portrait);
    return {
      element,
      shape: SHAPE_IDS[element.dataset.cloudShape ?? 'portrait'] ?? 0,
      target: isPortrait ? photo : element.querySelector<HTMLElement>('[data-cloud-target]'),
      portrait: isPortrait,
      opacity: Number(element.dataset.cloudOpacity ?? '1'),
    };
  });
  const streams = [...document.querySelectorAll<HTMLElement>('[data-cloud-stream]')];
  const dims = [...document.querySelectorAll<HTMLElement>('[data-cloud-dim]')];
  let keys: Key[] = [];
  let stopBoxes: Array<{ top: number; bottom: number }> = [];
  let dimRanges: Array<{ top: number; bottom: number; factor: number }> = [];
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  let worldPerPixel = 1;

  const measure = (): void => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect;
    worldPerPixel = (2 * CAMERA_Z * Math.tan(((FOV / 2) * Math.PI) / 180)) / viewportHeight;

    const scrollY = window.scrollY;
    const vh = viewportHeight;
    const maxCenter = document.documentElement.scrollHeight - vh / 2;
    const box = (element: HTMLElement): { top: number; bottom: number } => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
    };
    const boxes = stops.map((stop) => box(stop.element));
    const holds = boxes.map((b, index) => {
      let start = index === 0 ? -Infinity : b.top + vh * 0.1;
      let end = index === boxes.length - 1 ? Infinity : b.bottom - vh * 0.1;
      if (end < start) {
        start = end = (b.top + b.bottom) / 2;
      }
      if (index === boxes.length - 1) {
        start = Math.min(start, maxCenter - 1);
      }
      return { start, end };
    });
    const streamBoxes = streams.map(box);
    const morphSpan = vh * 1.1;
    const next: Key[] = [];
    holds.forEach((hold, index) => {
      next.push({ at: hold.start, p: index }, { at: hold.end, p: index });
      const following = holds[index + 1];
      if (!following) {
        return;
      }
      const inside = streamBoxes.filter((s) => s.top >= boxes[index].bottom - 2 && s.bottom <= boxes[index + 1].top + 2);
      if (inside.length > 0) {
        // Disperse into the stream before the stream sections, flow through them, re-form after.
        const enter = inside[0].top + vh * 0.15;
        const exit = Math.max(enter, inside[inside.length - 1].bottom - vh * 0.15);
        if (enter - hold.end > morphSpan) {
          next.push({ at: enter - morphSpan, p: index });
        }
        next.push({ at: enter, p: index + 0.5 }, { at: exit, p: index + 0.5 });
        if (following.start - exit > morphSpan) {
          next.push({ at: following.start - morphSpan, p: index + 0.5 });
        }
      } else {
        const middle = (hold.end + following.start) / 2;
        const span = Math.min(following.start - hold.end, morphSpan) / 2;
        next.push({ at: middle - span, p: index }, { at: middle + span, p: index + 1 });
      }
    });
    stopBoxes = boxes;
    keys = next.filter((key) => Number.isFinite(key.at)).sort((a, b) => a.at - b.at);
    dimRanges = dims.map((element) => ({ ...box(element), factor: Number(element.dataset.cloudDim ?? '0.4') }));
  };

  const progressAt = (center: number): number => {
    if (keys.length === 0 || center <= keys[0].at) {
      return keys[0]?.p ?? 0;
    }
    for (let i = 1; i < keys.length; i += 1) {
      if (center <= keys[i].at) {
        const a = keys[i - 1];
        const b = keys[i];
        const span = b.at - a.at;
        return span <= 0 ? b.p : lerp(a.p, b.p, (center - a.at) / span);
      }
    }
    return keys[keys.length - 1].p;
  };

  /**
   * Where a stop's shape is drawn. Shapes follow their target box like position: sticky:
   * they scroll in with their section, stay on screen while it is the current stop and
   * report how far the content has moved past them (used to fade them while reading).
   */
  const anchorOf = (index: number, center: number): Anchor => {
    const stop = stops[index];
    const header = 76;
    if (stop.target) {
      const rect = stop.target.getBoundingClientRect();
      const size = stop.portrait ? rect.height : Math.min(rect.width, rect.height);
      const realY = rect.top + rect.height / 2;
      const minY = Math.min(header + size / 2, viewportHeight / 2);
      const maxY = Math.max(viewportHeight - size / 2 - 8, viewportHeight / 2);
      const y = Math.min(maxY, Math.max(minY, realY));
      return { x: rect.left + rect.width / 2, y, size, past: Math.min(1, Math.max(0, (y - realY) / (viewportHeight * 0.6))) };
    }
    const top = stopBoxes[index]?.top ?? 0;
    const past = Math.min(1, Math.max(0, (center - (top + viewportHeight * 0.85)) / (viewportHeight * 0.6)));
    if (viewportWidth >= 1000) {
      const container = Math.min(1180, viewportWidth - 80);
      const right = (viewportWidth + container) / 2;
      const size = Math.min(viewportHeight * 0.46, container * 0.32);
      return { x: right - size * 0.62, y: viewportHeight * 0.5, size, past };
    }
    const size = Math.min(viewportWidth * 0.62, viewportHeight * 0.4);
    return { x: viewportWidth - size * 0.5, y: viewportHeight * 0.36, size, past };
  };

  /** Code-drawn shapes are quieter on small screens, where they sit behind the text. */
  const stopOpacity = (index: number, anchor: Anchor): number => {
    const stop = stops[index];
    return stop.opacity * (stop.portrait || viewportWidth >= 1000 ? 1 : 0.42) * lerp(1, 0.3, anchor.past);
  };

  // ---- Pointer: repel + tilt. Touch drags count too.
  const pointer = { x: 0, y: 0, strength: 0, lastMove: -1e9 };
  const onPointer = (clientX: number, clientY: number): void => {
    pointer.x = (clientX / viewportWidth) * 2 - 1;
    pointer.y = -(clientY / viewportHeight) * 2 + 1;
    pointer.lastMove = performance.now();
    wake();
  };
  const onPointerMove = (event: PointerEvent): void => onPointer(event.clientX, event.clientY);
  const onTouch = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (touch) {
      onPointer(touch.clientX, touch.clientY);
    }
  };
  const onPointerLeave = (): void => {
    pointer.lastMove = -1e9;
  };

  // ---- Loop.
  let frame = 0;
  let running = false;
  let disposed = false;
  let introStart = -1;
  let lastTime = performance.now();
  let time = 0;
  const state = { p: 0, opacity: 0, x: 0, y: 0, size: 0, rotX: 0, rotY: 0, strength: 0, initialised: false };
  const portraitPointSize = (): number => Math.min(3.2, Math.max(1.6, (photo.getBoundingClientRect().height / rows) * 1.75));

  const tick = (now: number): void => {
    frame = 0;
    if (disposed) {
      return;
    }
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    time += dt;
    const ease = 1 - Math.exp(-dt * 6);

    const center = window.scrollY + viewportHeight / 2;
    const targetP = progressAt(center);
    state.p = state.initialised ? lerp(state.p, targetP, 1 - Math.exp(-dt * 9)) : targetP;
    const fromIndex = Math.min(stops.length - 1, Math.max(0, Math.floor(state.p)));
    const toIndex = Math.min(stops.length - 1, fromIndex + 1);
    const t = Math.min(1, Math.max(0, state.p - fromIndex));
    const from = stops[fromIndex];
    const to = stops[toIndex];

    const a = anchorOf(fromIndex, center);
    const b = fromIndex === toIndex ? a : anchorOf(toIndex, center);
    const blend = smooth(t);
    const target = { x: lerp(a.x, b.x, blend), y: lerp(a.y, b.y, blend), size: lerp(a.size, b.size, blend) };
    if (!state.initialised) {
      Object.assign(state, target, { initialised: true });
    } else {
      // While holding, the shape follows its box exactly; during a morph it glides.
      const follow = 1 - Math.exp(-dt * (t < 0.02 || t > 0.98 ? 40 : 9));
      state.x = lerp(state.x, target.x, follow);
      state.y = lerp(state.y, target.y, follow);
      state.size = lerp(state.size, target.size, follow);
    }

    let dim = 1;
    dimRanges.forEach((range) => {
      if (center >= range.top && center <= range.bottom) {
        dim = Math.min(dim, range.factor);
      }
    });
    const targetOpacity = introStart < 0 ? 0 : lerp(stopOpacity(fromIndex, a), stopOpacity(toIndex, b), blend) * dim;
    state.opacity = lerp(state.opacity, targetOpacity, ease);

    const active = now - pointer.lastMove < 2500;
    state.strength = lerp(state.strength, active ? 1 : 0, 1 - Math.exp(-dt * (active ? 8 : 2)));
    const spin = (from.shape >= 2 ? 1 - blend : 0) + (to.shape >= 2 ? blend : 0);
    const targetRotY = pointer.x * 0.16 * state.strength + Math.sin(time * 0.45) * 0.5 * spin;
    const targetRotX = -pointer.y * 0.1 * state.strength + Math.sin(time * 0.3) * 0.08 * spin;
    state.rotX = lerp(state.rotX, targetRotX, ease);
    state.rotY = lerp(state.rotY, targetRotY, ease);

    // The photo hands over to the points once the portrait has been on screen, so the
    // assembling intro is actually seen (on phones the portrait is below the fold).
    if (introStart < 0 && photo.getBoundingClientRect().top < viewportHeight * 0.8) {
      introStart = now;
      hero.classList.add('hero--cloud');
    }
    if (introStart >= 0) {
      uniforms.uIntro.value = Math.min(1, (now - introStart) / 1800);
    }

    points.position.set((state.x - viewportWidth / 2) * worldPerPixel, -(state.y - viewportHeight / 2) * worldPerPixel, 0);
    points.scale.setScalar(state.size * worldPerPixel);
    points.rotation.set(state.rotX, state.rotY, 0);

    uniforms.uTime.value = time;
    uniforms.uFrom.value = from.shape;
    uniforms.uTo.value = to.shape;
    uniforms.uT.value = fromIndex === toIndex ? 0 : t;
    uniforms.uOpacity.value = state.opacity;
    uniforms.uStreamWidth.value = (viewportWidth * 1.15) / Math.max(1, state.size);
    uniforms.uMouseStrength.value = state.strength;
    uniforms.uMouse.value.set(pointer.x, pointer.y);
    const shapeSize = viewportWidth < 1000 ? 1.6 : 1.9;
    uniforms.uPointSize.value = lerp(from.shape === 0 ? portraitPointSize() : shapeSize, to.shape === 0 ? portraitPointSize() : shapeSize, blend);

    renderer.render(scene, camera);

    const settledInvisible = state.opacity < 0.004 && targetOpacity < 0.004;
    if (settledInvisible || document.visibilityState !== 'visible') {
      running = false;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  function wake(): void {
    if (disposed || running || document.visibilityState !== 'visible') {
      return;
    }
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  let measureQueued = 0;
  const queueMeasure = (): void => {
    if (measureQueued) {
      return;
    }
    measureQueued = requestAnimationFrame(() => {
      measureQueued = 0;
      measure();
      wake();
    });
  };

  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      wake();
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      running = false;
    }
  };

  const resizeObserver = new ResizeObserver(queueMeasure);
  resizeObserver.observe(document.body);
  window.addEventListener('resize', queueMeasure, { passive: true });
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('touchstart', onTouch, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibility);

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (frame) {
      cancelAnimationFrame(frame);
    }
    if (measureQueued) {
      cancelAnimationFrame(measureQueued);
    }
    resizeObserver.disconnect();
    window.removeEventListener('resize', queueMeasure);
    window.removeEventListener('scroll', wake);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchstart', onTouch);
    window.removeEventListener('touchmove', onTouch);
    document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    hero.classList.remove('hero--cloud');
    document.documentElement.classList.remove('has-cloud');
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    dispose();
  });

  document.body.prepend(canvas);
  document.documentElement.classList.add('has-cloud');
  measure();
  wake();
  return { dispose };
}
