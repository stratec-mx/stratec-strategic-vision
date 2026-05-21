// src/components/NetworkBackground.tsx
//
// Drop-in animated network background for the Stratec Hero.
//
// What it is:
//   A subtle SVG mesh of nodes that draws itself in from the hub outward,
//   then continuously moves small particles along the connections.
//
// Honors:
//   - Your existing palette (uses olive accent + smoke base — no new colors)
//   - prefers-reduced-motion (falls back to a static, fully drawn network)
//   - No new dependencies (pure React, no framer-motion needed for the network)
//
// How to use in src/components/sections/Hero.tsx:
//   1) Add this import at the top:
//        import { NetworkBackground } from "@/components/NetworkBackground";
//
//   2) Inside the existing background <div className="absolute inset-0">,
//      add <NetworkBackground /> on its own line. Suggested position:
//
//        <div className="absolute inset-0">
//          <img src={hero} ... />
//          <div className="absolute inset-0 bg-gradient-to-r ..." />
//          <NetworkBackground />              {/* ← add this line */}
//          <div className="absolute inset-0 grid-bg-light opacity-50" />
//        </div>
//
//   That's it. No other changes to the page are needed.

import { useEffect, useMemo, useRef, useState } from "react";

type Node = { id: number; x: number; y: number; r: number; isHub?: boolean };
type Edge = { from: number; to: number; len: number; delay: number };

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const generate = (w: number, h: number, count: number) => {
  const r = rng(7);
  const nodes: Node[] = [];
  const minDist = Math.min(w, h) * 0.07;
  let guard = 0;
  while (nodes.length < count && guard < count * 30) {
    guard++;
    const x = r() * w;
    const y = r() * h;
    let ok = true;
    for (const n of nodes) {
      if (Math.hypot(n.x - x, n.y - y) < minDist) { ok = false; break; }
    }
    if (ok) nodes.push({ id: nodes.length, x, y, r: 1.6 + r() * 1.4 });
  }

  let hubId = 0;
  let bestD = Infinity;
  nodes.forEach((n) => {
    const d = Math.hypot(n.x - w / 2, n.y - h / 2);
    if (d < bestD) { bestD = d; hubId = n.id; }
  });
  if (nodes[hubId]) {
    nodes[hubId].isHub = true;
    nodes[hubId].r = 4.5;
  }

  const k = 3;
  const maxLen = Math.min(w, h) * 0.32;
  const seen = new Set<string>();
  const edges: Edge[] = [];
  nodes.forEach((n) => {
    const others = nodes
      .filter((m) => m.id !== n.id)
      .map((m) => ({ id: m.id, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    others.forEach(({ id, d }) => {
      if (d > maxLen) return;
      const key = n.id < id ? `${n.id}-${id}` : `${id}-${n.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ from: n.id, to: id, len: d, delay: 0 });
    });
  });

  const hub = nodes[hubId];
  edges.forEach((e) => {
    const a = nodes[e.from], b = nodes[e.to];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    e.delay = Math.hypot(mx - hub.x, my - hub.y) / Math.hypot(w, h);
  });
  edges.sort((a, b) => a.delay - b.delay);

  return { nodes, edges, hubId };
};

// Adjacency list for path walking.
const buildAdjacency = (edges: Edge[]) => {
  const adj = new Map<number, number[]>();
  edges.forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
  });
  return adj;
};

// Non-repeating random walk through the network from startId.
const walkPath = (adj: Map<number, number[]>, startId: number, steps: number, seed: number) => {
  const r = rng(seed);
  const path: number[] = [startId];
  const visited = new Set<number>([startId]);
  let current = startId;
  for (let s = 0; s < steps; s++) {
    const neighbors = (adj.get(current) || []).filter((n) => !visited.has(n));
    if (!neighbors.length) break;
    const next = neighbors[Math.floor(r() * neighbors.length)];
    path.push(next);
    visited.add(next);
    current = next;
  }
  return path;
};

const pathToD = (nodes: Node[], ids: number[]) => {
  if (!ids.length) return "";
  let d = `M${nodes[ids[0]].x} ${nodes[ids[0]].y}`;
  for (let i = 1; i < ids.length; i++) d += ` L${nodes[ids[i]].x} ${nodes[ids[i]].y}`;
  return d;
};

interface Props {
  /** Extra class names for the container. */
  className?: string;
  /** Multiplier on node count. Default 1. */
  density?: number;
  /** Accent color (hub + particles). Defaults to the theme olive. */
  accent?: string;
  /** Base color (regular nodes + edges). Defaults to the theme smoke. */
  base?: string;
}

export const NetworkBackground = ({
  className = "",
  density = 1,
  accent = "hsl(var(--olive))",
  base = "hsl(var(--smoke))",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    setMounted(true);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges, hubId } = useMemo(() => {
    const area = size.w * size.h;
    const count = Math.max(14, Math.min(52, Math.round((area / 22000) * density)));
    return generate(size.w, size.h, count);
  }, [size.w, size.h, density]);

  // Slow, continuous ambient particles along single edges.
  const particleEdges = useMemo(() => {
    if (!edges.length) return [];
    const step = Math.max(2, Math.floor(edges.length / 10));
    const picks: Edge[] = [];
    for (let i = 0; i < edges.length && picks.length < 6; i += step) picks.push(edges[i]);
    return picks;
  }, [edges]);

  // Multi-hop paths used by the rare "rapid response" bursts.
  // Each path: a non-repeating walk of 4-5 nodes. Three independent paths
  // so the bursts feel uncorrelated, like real-world alerts.
  const rapidPaths = useMemo(() => {
    if (!edges.length || !nodes.length) return [];
    const adj = buildAdjacency(edges);
    const seeds = [101, 233, 359];
    const out: { d: string }[] = [];
    seeds.forEach((seed) => {
      const r = rng(seed);
      const startId = Math.floor(r() * nodes.length);
      const path = walkPath(adj, startId, 5, seed + 17);
      if (path.length >= 3) out.push({ d: pathToD(nodes, path) });
    });
    return out;
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {mounted && nodes.length > 0 && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          style={{ position: "absolute", inset: 0, color: base }}
        >
          <defs>
            <radialGradient id="nb-hub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>

          {nodes[hubId] && (
            <circle
              cx={nodes[hubId].x}
              cy={nodes[hubId].y}
              r={90}
              fill="url(#nb-hub-glow)"
              style={{
                animation: reducedMotion ? undefined : "nb-hub-glow 4.8s ease-in-out infinite",
                transformOrigin: `${nodes[hubId].x}px ${nodes[hubId].y}px`,
              }}
            />
          )}

          {edges.map((e, i) => {
            const a = nodes[e.from];
            const b = nodes[e.to];
            if (!a || !b) return null;
            const len = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
            const delay = reducedMotion ? 0 : 0.25 + e.delay * 1.8;
            return (
              <line
                key={`e-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="currentColor"
                strokeWidth={0.75}
                strokeOpacity={0.22}
                strokeLinecap="round"
                style={{
                  strokeDasharray: len,
                  strokeDashoffset: reducedMotion ? 0 : len,
                  animation: reducedMotion
                    ? undefined
                    : `nb-draw 1s ${delay}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                }}
              />
            );
          })}

          {nodes.map((n, i) => {
            const delay = reducedMotion ? 0 : 0.4 + (i / Math.max(1, nodes.length)) * 1.8;
            return (
              <g
                key={`n-${n.id}`}
                style={{
                  opacity: reducedMotion ? 1 : 0,
                  animation: reducedMotion ? undefined : `nb-fade-in 0.7s ${delay}s ease-out forwards`,
                }}
              >
                {n.isHub && (
                  <circle
                    cx={n.x} cy={n.y} r={n.r + 3}
                    fill="none"
                    stroke={accent}
                    strokeWidth={1}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      animation: reducedMotion ? undefined : "nb-ring 3.2s ease-out infinite",
                    }}
                  />
                )}
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={n.isHub ? accent : "currentColor"}
                  fillOpacity={n.isHub ? 1 : 0.5}
                />
              </g>
            );
          })}

          {!reducedMotion && particleEdges.map((e, i) => {
            const a = nodes[e.from], b = nodes[e.to];
            if (!a || !b) return null;
            const dur = 2.6 + (i % 4) * 0.7;
            const begin = 2.4 + i * 0.45;
            return (
              <circle key={`p-${i}`} r={1.8} fill={accent} opacity="0">
                <animate attributeName="cx" from={a.x} to={b.x}
                  dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                <animate attributeName="cy" from={a.y} to={b.y}
                  dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.9;0.9;0"
                  keyTimes="0;0.15;0.85;1"
                  dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Rapid-response bursts — every ~10s a fast signal streaks through
              several hops, then the network rests. Communicates "reaction speed"
              without becoming anxious noise. */}
          {!reducedMotion && rapidPaths.map((rp, i) => {
            const cycle = 9 + i * 1.7;       // 9s, 10.7s, 12.4s — desynced
            const burst = 1.05 + i * 0.12;   // ~1s traversal
            const begin = 4.2 + i * 1.9;     // hold first burst until the network has settled
            const burstFrac = burst / cycle;
            const fadeIn = (burstFrac + 0.005).toFixed(4);
            const bf = burstFrac.toFixed(4);
            return (
              <g key={`rapid-${i}`}>
                {/* Leading bright pulse */}
                <circle r={2.4} fill={accent} opacity="0">
                  <animateMotion
                    dur={`${cycle}s`} begin={`${begin}s`} repeatCount="indefinite"
                    calcMode="linear" keyTimes={`0;${bf};1`} keyPoints="0;1;1"
                    path={rp.d}
                  />
                  <animate attributeName="opacity"
                    values="0;1;1;0;0"
                    keyTimes={`0;0.005;${bf};${fadeIn};1`}
                    dur={`${cycle}s`} begin={`${begin}s`} repeatCount="indefinite"
                  />
                </circle>
                {/* Short trailing ghost ~70ms behind, for subtle motion-blur feel */}
                <circle r={1.7} fill={accent} opacity="0">
                  <animateMotion
                    dur={`${cycle}s`} begin={`${begin + 0.07}s`} repeatCount="indefinite"
                    calcMode="linear" keyTimes={`0;${bf};1`} keyPoints="0;1;1"
                    path={rp.d}
                  />
                  <animate attributeName="opacity"
                    values="0;0.45;0.45;0;0"
                    keyTimes={`0;0.005;${bf};${fadeIn};1`}
                    dur={`${cycle}s`} begin={`${begin + 0.07}s`} repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>
      )}

      <style>{`
        @keyframes nb-draw { to { stroke-dashoffset: 0; } }
        @keyframes nb-fade-in { to { opacity: 1; } }
        @keyframes nb-hub-glow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.18); }
        }
        @keyframes nb-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          80%  { opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default NetworkBackground;
