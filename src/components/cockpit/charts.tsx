"use client"

import { useId, useState } from "react"
import { chf } from "@/lib/cockpit/calc"

// Farben: Marke (Gold, Tinte) für Serien, Status nur für Ampel-Texte. Eine Achse, dünne Marken, Tooltip beim Hover.
const INK = "#2C2C2C"
const GOLD = "#C5A572"
const MUTED = "#9A8F80"
const GRID = "#E7DED1"

export interface BarPoint { label: string; value: number; sub?: string; dim?: boolean }

interface TargetBarsProps {
  points: BarPoint[]
  boden?: number[]   // Break-even je Punkt
  basis?: number[]   // Basis je Punkt
  title: string
  height?: number
  valueLabel?: string
}

/** Balken pro Monat/Woche, dazu Boden- und Basis-Markierungen je Balken. */
export function TargetBars({ points, boden, basis, title, height = 220, valueLabel = "CHF" }: TargetBarsProps) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = height, padL = 56, padR = 12, padT = 16, padB = 34
  const max = Math.max(1, ...points.map((p) => p.value), ...(boden ?? []), ...(basis ?? [])) * 1.08
  const n = points.length
  const slot = (W - padL - padR) / Math.max(1, n)
  const bw = Math.min(34, slot * 0.56)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const ticks = 4
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i)

  return (
    <figure className="w-full" aria-labelledby={id}>
      <figcaption id={id} className="sr-only">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill={MUTED}>{chf(t) === "–" ? "0" : chf(t)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = padL + slot * i + (slot - bw) / 2
          const top = y(p.value)
          const isH = hover === i
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              <rect x={x} y={top} width={bw} height={Math.max(0, y(0) - top)} rx={4} fill={p.dim ? MUTED : GOLD} opacity={p.dim ? 0.55 : isH ? 1 : 0.9} />
              {boden && boden[i] != null && (
                <line x1={x - 5} x2={x + bw + 5} y1={y(boden[i])} y2={y(boden[i])} stroke={INK} strokeWidth={2} />
              )}
              {basis && basis[i] != null && (
                <line x1={x - 5} x2={x + bw + 5} y1={y(basis[i])} y2={y(basis[i])} stroke={INK} strokeWidth={2} strokeDasharray="3 3" opacity={0.6} />
              )}
              <text x={x + bw / 2} y={H - padB + 14} textAnchor="middle" fontSize={10} fill={MUTED}>{p.label}</text>
              {p.sub && <text x={x + bw / 2} y={H - padB + 26} textAnchor="middle" fontSize={9} fill={MUTED}>{p.sub}</text>}
            </g>
          )
        })}
        {hover != null && points[hover] && (() => {
          const p = points[hover]
          const x = padL + slot * hover + slot / 2
          const bx = Math.min(W - padR - 170, Math.max(padL, x - 85))
          const lines = [`${p.label}: ${chf(p.value)} ${valueLabel}`]
          if (boden && boden[hover] != null) lines.push(`Break-even ${chf(boden[hover])}`)
          if (basis && basis[hover] != null) lines.push(`Basis ${chf(basis[hover])}`)
          return (
            <g pointerEvents="none">
              <rect x={bx} y={padT} width={170} height={14 + lines.length * 14} rx={6} fill="#fff" stroke={GRID} />
              {lines.map((l, k) => <text key={k} x={bx + 8} y={padT + 16 + k * 14} fontSize={11} fill={INK} fontWeight={k === 0 ? 600 : 400}>{l}</text>)}
            </g>
          )
        })()}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: GOLD }} />{title}</span>
        {boden && <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: INK }} />Break-even</span>}
        {basis && <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: INK }} />Basis</span>}
      </div>
    </figure>
  )
}

interface StackPoint { label: string; parts: number[]; sub?: string }

/** Gestapelte Balken (Restaurant, Anlässe, Frühstück, HP) mit Zielmarke. */
export function StackedBars({ points, names, target, title, height = 240 }: { points: StackPoint[]; names: string[]; target?: number[]; title: string; height?: number }) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const colors = [GOLD, "#8A6E3F", "#B8A98F", "#5C5347"]
  const W = 720, H = height, padL = 56, padR = 12, padT = 16, padB = 34
  const totals = points.map((p) => p.parts.reduce((a, b) => a + b, 0))
  const max = Math.max(1, ...totals, ...(target ?? [])) * 1.08
  const n = points.length
  const slot = (W - padL - padR) / Math.max(1, n)
  const bw = Math.min(40, slot * 0.6)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const tickVals = Array.from({ length: 5 }, (_, i) => (max / 4) * i)
  return (
    <figure className="w-full" aria-labelledby={id}>
      <figcaption id={id} className="sr-only">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill={MUTED}>{chf(t) === "–" ? "0" : chf(t)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = padL + slot * i + (slot - bw) / 2
          let acc = 0
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {p.parts.map((v, k) => {
                const y0 = y(acc + v), h = Math.max(0, y(acc) - y(acc + v) - (v > 0 ? 2 : 0))
                acc += v
                return v > 0 ? <rect key={k} x={x} y={y0} width={bw} height={h} fill={colors[k % colors.length]} opacity={hover === i ? 1 : 0.9} /> : null
              })}
              {target && target[i] != null && <line x1={x - 6} x2={x + bw + 6} y1={y(target[i])} y2={y(target[i])} stroke={INK} strokeWidth={2} />}
              <text x={x + bw / 2} y={H - padB + 14} textAnchor="middle" fontSize={10} fill={MUTED}>{p.label}</text>
              {p.sub && <text x={x + bw / 2} y={H - padB + 26} textAnchor="middle" fontSize={9} fill={MUTED}>{p.sub}</text>}
            </g>
          )
        })}
        {hover != null && points[hover] && (() => {
          const p = points[hover]
          const x = padL + slot * hover + slot / 2
          const bx = Math.min(W - padR - 190, Math.max(padL, x - 95))
          const lines = [`${p.label}: ${chf(totals[hover])}`, ...p.parts.map((v, k) => `${names[k]} ${chf(v)}`)]
          if (target && target[hover] != null) lines.push(`Break-even ${chf(target[hover])}`)
          return (
            <g pointerEvents="none">
              <rect x={bx} y={padT} width={190} height={14 + lines.length * 14} rx={6} fill="#fff" stroke={GRID} />
              {lines.map((l, k) => <text key={k} x={bx + 8} y={padT + 16 + k * 14} fontSize={11} fill={INK} fontWeight={k === 0 ? 600 : 400}>{l}</text>)}
            </g>
          )
        })()}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        {names.map((nm, k) => <span key={nm} className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: colors[k % colors.length] }} />{nm}</span>)}
        {target && <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: INK }} />Break-even</span>}
      </div>
    </figure>
  )
}
