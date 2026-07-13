"use client";

import type { Ref } from "react";
import { cutawayViewBox, deviceLayers, scenes } from "@/config/content";

const { width: VB_W, height: VB_H } = cutawayViewBox;

/**
 * The internal cutaway, drawn rather than photographed.
 *
 * The client's reference is a flat raster: nine labels pointing at one image. To
 * highlight a single layer we need each layer to *be* a thing — something we can
 * dim, glow and hang a connector line off — and a JPEG cannot be taken apart into
 * nine of those. So the column is drawn here, in the site's own palette, with one
 * addressable `<g data-layer>` per material and a matching `<g data-halo>` behind
 * it. GlacierExperience animates those two attributes and nothing else.
 *
 * Every coordinate below is in `cutawayViewBox` units, which is the same space
 * the `anchor` points in content.ts are expressed as percentages of. Move a band
 * here and its anchor there has to move with it.
 *
 * Nothing in this drawing asserts anything. It shows what the manufacturer says
 * is in the column, in the order they say it is in — no flow arrows implying a
 * mechanism, no pH scale, no "before and after".
 */

/* -------------------------------------------------------------------------- *
 * Geometry. The single source of truth for where every band sits.
 * -------------------------------------------------------------------------- */

/** The bore: the hollow inside of the column, and the water's whole path. */
const BORE = { x: 82, y: 126, w: 76, h: 668 } as const;

/**
 * The bore as percentages of the drawing's box, so WaterFlow — which is DOM, not
 * SVG — can be positioned over exactly the same rectangle at any size.
 */
export const CUTAWAY_BORE = {
  left: (BORE.x / VB_W) * 100,
  top: (BORE.y / VB_H) * 100,
  width: (BORE.w / VB_W) * 100,
  height: (BORE.h / VB_H) * 100,
} as const;

/** Vertical extent of each material band, top to bottom. */
const BANDS = {
  himalayan: { y: 130, h: 66 },
  japanese: { y: 196, h: 66 },
  wood: { y: 284, h: 102 },
  magnesium: { y: 408, h: 62 },
  magnet: { y: 470, h: 30 },
  korean: { y: 500, h: 140 },
  zinc: { y: 662, h: 74 },
} as const;

/** The carbon separators between chambers. Structure, not a callable layer. */
const DISCS = [262, 386, 640, 736] as const;
const DISC_H = 22;

/** Where each halo sits and how tall it is. The funnel's is its own shape. */
const HALOS: Record<string, { y: number; h: number }> = {
  funnel: { y: 10, h: 116 },
  himalayan: BANDS.himalayan,
  japanese: BANDS.japanese,
  "jamun-wood": BANDS.wood,
  silver: BANDS.wood,
  magnesium: BANDS.magnesium,
  magnet: BANDS.magnet,
  "korean-media": BANDS.korean,
  zinc: BANDS.zinc,
};

/* -------------------------------------------------------------------------- *
 * Deterministic scatter.
 *
 * The stone beds need to look packed rather than tiled, but they must be
 * IDENTICAL on the server and in the browser or React will throw a hydration
 * mismatch. So there is no Math.random() anywhere: a seeded generator runs once,
 * at module scope, and the same numbers come out on both sides.
 * -------------------------------------------------------------------------- */

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type Box = { y: number; h: number };
type Pebble = { cx: number; cy: number; r: number; fill: string };

/** A loose bed of rounded stones, packed into a band of the bore. */
function pebbles(
  seed: number,
  { y, h }: Box,
  count: number,
  minR: number,
  maxR: number,
  palette: readonly string[],
): Pebble[] {
  const random = seeded(seed);
  const inset = 2;

  return Array.from({ length: count }, () => {
    const r = minR + random() * (maxR - minR);
    return {
      cx: BORE.x + inset + r + random() * (BORE.w - 2 * (inset + r)),
      cy: y + inset + r + random() * (h - 2 * (inset + r)),
      r,
      fill: palette[Math.floor(random() * palette.length)],
    };
  });
}

/** A packed grid of spheres, jittered. The Korean media bed is uniform, not loose. */
function packed(
  seed: number,
  { y, h }: Box,
  columns: number,
  rows: number,
  palette: readonly string[],
): Pebble[] {
  const random = seeded(seed);
  const stepX = BORE.w / columns;
  const stepY = h / rows;
  const r = Math.min(stepX, stepY) * 0.44;

  const out: Pebble[] = [];
  for (let row = 0; row < rows; row += 1) {
    // Offset every other row so the spheres nest instead of lining up in a lattice.
    const offset = row % 2 === 0 ? 0 : stepX / 2;
    for (let column = 0; column < columns; column += 1) {
      const cx = BORE.x + offset + stepX * (column + 0.5) + (random() - 0.5) * 2;
      if (cx - r < BORE.x + 1 || cx + r > BORE.x + BORE.w - 1) continue;
      out.push({
        cx,
        cy: y + stepY * (row + 0.5) + (random() - 0.5) * 2,
        r,
        fill: palette[Math.floor(random() * palette.length)],
      });
    }
  }
  return out;
}

/** Angular flakes, for the two metals that are held as foil rather than as stone. */
function shards(seed: number, { y, h }: Box, count: number): string[] {
  const random = seeded(seed);

  return Array.from({ length: count }, () => {
    const cx = BORE.x + 8 + random() * (BORE.w - 16);
    const cy = y + 8 + random() * (h - 16);
    const size = 5 + random() * 7;

    // Five points around the centre at a jittered radius: a crumpled flake.
    const points = Array.from({ length: 5 }, (_, i) => {
      const angle = (i / 5) * Math.PI * 2 + random() * 0.6;
      const radius = size * (0.55 + random() * 0.65);
      return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(
        cy +
        Math.sin(angle) * radius * 0.75
      ).toFixed(1)}`;
    });

    return points.join(" ");
  });
}

/* -------------------------------------------------------------------------- *
 * Palettes. Desaturated toward the site's glacier / navy range: the reference
 * artwork's primary-coloured media would fight everything else on the page.
 * -------------------------------------------------------------------------- */

const HIMALAYAN = ["#8c9aa6", "#6f8090", "#a8b4bd", "#7a6a5c", "#9c8d7d"] as const;
const JAPANESE = ["#d9cfbe", "#c4b8a4", "#e6ded1", "#b3a893"] as const;
const KOREAN = ["#7d9bb0", "#b08d57", "#86a17a", "#a97a7a", "#c9b47a", "#6f8fa8"] as const;

const HIMALAYAN_STONES = pebbles(11, BANDS.himalayan, 34, 3.6, 6.4, HIMALAYAN);
const JAPANESE_STONES = pebbles(29, BANDS.japanese, 30, 4, 7, JAPANESE);
const KOREAN_MEDIA = packed(47, BANDS.korean, 6, 11, KOREAN);
const MAGNESIUM_FLAKES = shards(83, BANDS.magnesium, 7);
const ZINC_FLAKES = shards(97, BANDS.zinc, 8);

/** Woodgrain: gentle arcs across the chamber the silver sits in. */
const GRAIN = Array.from({ length: 7 }, (_, i) => {
  const y = BANDS.wood.y + 10 + i * 13;
  return `M${BORE.x + 3} ${y} Q ${BORE.x + BORE.w / 2} ${y + (i % 2 === 0 ? 5 : -5)} ${
    BORE.x + BORE.w - 3
  } ${y}`;
});

type DeviceCutawayProps = {
  ref?: Ref<SVGSVGElement>;
};

export function DeviceCutaway({ ref }: DeviceCutawayProps) {
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={scenes.howItWorks.cutawayAlt}
      className="h-full w-full overflow-visible"
    >
      <defs>
        {/* The highlight behind an active layer. One gradient, reused nine times. */}
        <radialGradient id="cut-halo">
          <stop offset="0%" stopColor="#9fd4f0" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#6fbfe6" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#6fbfe6" stopOpacity="0" />
        </radialGradient>

        {/* Brass, lit from the left, as on the supplied render. */}
        <linearGradient id="cut-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a5f2e" />
          <stop offset="35%" stopColor="#e6b980" />
          <stop offset="60%" stopColor="#c08a4a" />
          <stop offset="100%" stopColor="#7d5527" />
        </linearGradient>

        <linearGradient id="cut-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a3644" />
          <stop offset="30%" stopColor="#6a7a8b" />
          <stop offset="55%" stopColor="#43525f" />
          <stop offset="100%" stopColor="#222c37" />
        </linearGradient>

        {/* The bore: unlit, so the media inside it reads as being in shadow. */}
        <linearGradient id="cut-bore" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#05090f" />
          <stop offset="45%" stopColor="#0d151f" />
          <stop offset="100%" stopColor="#05090f" />
        </linearGradient>

        <linearGradient id="cut-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b3d18" />
          <stop offset="45%" stopColor="#b5711d" />
          <stop offset="100%" stopColor="#7a4a1c" />
        </linearGradient>
      </defs>

      {/* ---------------------------------------------------------------- *
       * Halos. Drawn first so they sit behind everything; each one is held
       * at zero opacity until its layer becomes the active one.
       * ---------------------------------------------------------------- */}
      {deviceLayers.map((layer) => {
        const halo = HALOS[layer.id];
        if (!halo) return null;

        return (
          <ellipse
            key={`halo-${layer.id}`}
            data-halo={layer.id}
            cx={VB_W / 2}
            cy={halo.y + halo.h / 2}
            rx={VB_W * 0.46}
            ry={halo.h / 2 + 26}
            fill="url(#cut-halo)"
            opacity={0}
          />
        );
      })}

      {/* ---------------------------------------------------------------- *
       * The shell. Structure, never dimmed — it is what the layers sit in.
       * ---------------------------------------------------------------- */}
      <g data-shell>
        <rect
          x={BORE.x - 8}
          y={118}
          width={BORE.w + 16}
          height={684}
          rx={5}
          fill="url(#cut-steel)"
        />
        <rect
          x={BORE.x}
          y={BORE.y}
          width={BORE.w}
          height={BORE.h}
          fill="url(#cut-bore)"
        />

        {/* Brass collars, top and bottom. */}
        <rect x={64} y={110} width={112} height={16} rx={4} fill="url(#cut-brass)" />
        <rect x={64} y={790} width={112} height={16} rx={4} fill="url(#cut-brass)" />

        {/* Outlet. */}
        <rect x={108} y={802} width={24} height={64} fill="url(#cut-steel)" />
        <rect x={102} y={800} width={36} height={7} rx={3} fill="url(#cut-brass)" />

        {/* Carbon separators between the chambers. */}
        {DISCS.map((y) => (
          <g key={`disc-${y}`}>
            <rect
              x={BORE.x}
              y={y}
              width={BORE.w}
              height={DISC_H}
              fill="#171c22"
            />
            <rect
              x={BORE.x}
              y={y}
              width={BORE.w}
              height={1.5}
              fill="#3a444f"
              opacity={0.7}
            />
          </g>
        ))}
      </g>

      {/* ---------------------------------------------------------------- *
       * The nine layers. Each is one `data-layer` group and nothing else, so
       * the timeline can dim it, brighten it, and never touch its innards.
       * ---------------------------------------------------------------- */}

      {/* 1 — Funnel. */}
      <g data-layer="funnel">
        <path
          d={`M34 16 L${BORE.x + 20} 122 L${BORE.x + BORE.w - 20} 122 L206 16 Z`}
          fill="url(#cut-steel)"
        />
        <ellipse cx={120} cy={16} rx={86} ry={11} fill="#0d151f" />
        <ellipse
          cx={120}
          cy={16}
          rx={86}
          ry={11}
          fill="none"
          stroke="url(#cut-brass)"
          strokeWidth={4}
        />
        {/* The inner wall of the cone, so it reads as hollow rather than solid. */}
        <path
          d={`M44 18 L${BORE.x + 24} 118 L${BORE.x + BORE.w - 24} 118 L196 18 Z`}
          fill="#0a121b"
          opacity={0.85}
        />
      </g>

      {/* 2 — Himalayan stones. */}
      <g data-layer="himalayan-stones">
        {HIMALAYAN_STONES.map((stone, index) => (
          <circle
            key={`him-${index}`}
            cx={stone.cx}
            cy={stone.cy}
            r={stone.r}
            fill={stone.fill}
          />
        ))}
      </g>

      {/* 3 — Japanese stones. */}
      <g data-layer="japanese-stones">
        {JAPANESE_STONES.map((stone, index) => (
          <circle
            key={`jap-${index}`}
            cx={stone.cx}
            cy={stone.cy}
            r={stone.r}
            fill={stone.fill}
          />
        ))}
      </g>

      {/* 4 — Jamun wood: the body of the middle chamber. */}
      <g data-layer="jamun-wood">
        <rect
          x={BORE.x}
          y={BANDS.wood.y}
          width={BORE.w}
          height={BANDS.wood.h}
          fill="url(#cut-wood)"
        />
        {GRAIN.map((d, index) => (
          <path
            key={`grain-${index}`}
            d={d}
            fill="none"
            stroke="#4a2a10"
            strokeOpacity={0.45}
            strokeWidth={1.4}
          />
        ))}
      </g>

      {/* 5 — Silver: set into the wood, so it is drawn over it. */}
      <g data-layer="silver">
        <path
          d={`M${BORE.x + 16} ${BANDS.wood.y + 14}
              C ${BORE.x + 34} ${BANDS.wood.y + 34}, ${BORE.x + 10} ${BANDS.wood.y + 62}, ${
                BORE.x + 30
              } ${BANDS.wood.y + 88}`}
          fill="none"
          stroke="#e8edf2"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <path
          d={`M${BORE.x + BORE.w - 16} ${BANDS.wood.y + 14}
              C ${BORE.x + BORE.w - 34} ${BANDS.wood.y + 34}, ${BORE.x + BORE.w - 10} ${
                BANDS.wood.y + 62
              }, ${BORE.x + BORE.w - 30} ${BANDS.wood.y + 88}`}
          fill="none"
          stroke="#e8edf2"
          strokeWidth={7}
          strokeLinecap="round"
        />
        {/* A cooler highlight down one edge of each ribbon: silver, not white. */}
        <path
          d={`M${BORE.x + 16} ${BANDS.wood.y + 14}
              C ${BORE.x + 34} ${BANDS.wood.y + 34}, ${BORE.x + 10} ${BANDS.wood.y + 62}, ${
                BORE.x + 30
              } ${BANDS.wood.y + 88}`}
          fill="none"
          stroke="#9aa8b4"
          strokeWidth={2}
          strokeLinecap="round"
          transform="translate(1.5 1.5)"
        />
      </g>

      {/* 6 — Magnesium. */}
      <g data-layer="magnesium">
        {MAGNESIUM_FLAKES.map((points, index) => (
          <polygon
            key={`mg-${index}`}
            points={points}
            fill="#cfd8e0"
            stroke="#8a97a3"
            strokeWidth={0.8}
          />
        ))}
      </g>

      {/* 7 — Magnet: a disc seated across the full width of the column. */}
      <g data-layer="magnet">
        <rect
          x={BORE.x}
          y={BANDS.magnet.y}
          width={BORE.w}
          height={BANDS.magnet.h}
          fill="#12171d"
        />
        <rect
          x={BORE.x}
          y={BANDS.magnet.y}
          width={BORE.w}
          height={BANDS.magnet.h}
          fill="none"
          stroke="#3d94c4"
          strokeOpacity={0.5}
          strokeWidth={1.2}
        />
        <ellipse
          cx={VB_W / 2}
          cy={BANDS.magnet.y + BANDS.magnet.h / 2}
          rx={16}
          ry={7}
          fill="none"
          stroke="#6fbfe6"
          strokeOpacity={0.55}
          strokeWidth={1.6}
        />
        <ellipse
          cx={VB_W / 2}
          cy={BANDS.magnet.y + BANDS.magnet.h / 2}
          rx={26}
          ry={11}
          fill="none"
          stroke="#6fbfe6"
          strokeOpacity={0.25}
          strokeWidth={1.2}
        />
      </g>

      {/* 8 — Korean media stones. */}
      <g data-layer="korean-media">
        {KOREAN_MEDIA.map((stone, index) => (
          <circle
            key={`kor-${index}`}
            cx={stone.cx}
            cy={stone.cy}
            r={stone.r}
            fill={stone.fill}
          />
        ))}
      </g>

      {/* 9 — Zinc. */}
      <g data-layer="zinc">
        {ZINC_FLAKES.map((points, index) => (
          <polygon
            key={`zn-${index}`}
            points={points}
            fill="#d6dde3"
            stroke="#93a0ac"
            strokeWidth={0.8}
          />
        ))}
      </g>

      {/* The anchor dots the connector lines land on. Above every layer, so an
          active dot is never buried under a stone. */}
      {deviceLayers.map((layer) => (
        <circle
          key={`anchor-${layer.id}`}
          data-anchor={layer.id}
          cx={(layer.anchor.x / 100) * VB_W}
          cy={(layer.anchor.y / 100) * VB_H}
          r={4}
          fill="#dceffa"
          opacity={0}
        />
      ))}
    </svg>
  );
}
