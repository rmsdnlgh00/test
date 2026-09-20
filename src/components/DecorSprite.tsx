import type { ReactElement } from 'react'
import type { DecorArt } from '../types'

/**
 * 소품 아트. 배경과 같은 톤을 유지하려고 플랫 벡터 + 얇은 외곽선으로 그린다.
 * 모든 그림은 viewBox 100x100 안에서 '밑동이 바닥(y=100)에 닿도록' 그려져 있어,
 * 배치 좌표를 밑동 기준으로 그대로 쓸 수 있다.
 */
export function DecorSprite({ art, className }: { art: DecorArt; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="95" rx="26" ry="5" fill="rgba(60,80,40,0.18)" />
      {ART[art]}
    </svg>
  )
}

const OUTLINE = '#7a6448'

const ART: Record<DecorArt, ReactElement> = {
  tree: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M46 95 L46 58 L54 58 L54 95 Z" fill="#a97f52" />
      <circle cx="50" cy="38" r="26" fill="#8fc96b" />
      <circle cx="31" cy="48" r="16" fill="#7fb85c" />
      <circle cx="69" cy="48" r="16" fill="#9ed37b" />
      <circle cx="50" cy="22" r="14" fill="#a5da82" stroke="none" />
    </g>
  ),
  bush: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <circle cx="34" cy="70" r="20" fill="#7fb85c" />
      <circle cx="66" cy="70" r="20" fill="#8fc96b" />
      <circle cx="50" cy="56" r="22" fill="#9ed37b" />
      <g fill="#fff6d8" stroke="none">
        <circle cx="38" cy="54" r="3" />
        <circle cx="60" cy="62" r="3" />
        <circle cx="52" cy="42" r="3" />
      </g>
    </g>
  ),
  pumpkin: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <ellipse cx="50" cy="66" rx="34" ry="28" fill="#f2a65a" />
      <path d="M36 42 Q30 66 36 90" fill="none" stroke="#d1813a" strokeWidth="2.4" />
      <path d="M64 42 Q70 66 64 90" fill="none" stroke="#d1813a" strokeWidth="2.4" />
      <path d="M50 38 L50 28 Q58 24 60 30" fill="none" stroke="#6aa84a" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  lantern: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <rect x="44" y="46" width="12" height="48" fill="#8a6f52" />
      <ellipse cx="50" cy="94" rx="16" ry="5" fill="#7a6448" />
      <path d="M32 40 L50 12 L68 40 Z" fill="#c9a87c" />
      <rect x="34" y="38" width="32" height="26" rx="4" fill="#fff3c4" />
      <rect x="34" y="38" width="32" height="26" rx="4" fill="none" />
    </g>
  ),
  mushroom: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M40 94 Q36 74 44 70 L58 70 Q66 74 62 94 Z" fill="#f7ecd8" />
      <path d="M18 62 Q26 30 50 30 Q74 30 82 62 Z" fill="#e57b6a" />
      <g fill="#fff6e4" stroke="none">
        <ellipse cx="36" cy="50" rx="6" ry="5" />
        <ellipse cx="60" cy="44" rx="7" ry="6" />
        <ellipse cx="70" cy="56" rx="4.5" ry="4" />
      </g>
    </g>
  ),
  bench: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <rect x="10" y="52" width="80" height="10" rx="3" fill="#b98f62" />
      <rect x="10" y="34" width="80" height="9" rx="3" fill="#c79c6e" />
      <rect x="18" y="62" width="9" height="30" fill="#a97f52" />
      <rect x="73" y="62" width="9" height="30" fill="#a97f52" />
      <rect x="18" y="26" width="8" height="28" fill="#a97f52" />
      <rect x="74" y="26" width="8" height="28" fill="#a97f52" />
    </g>
  ),
  stone: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M18 92 Q10 62 34 50 Q62 40 80 58 Q92 74 84 92 Z" fill="#cfc6b6" />
      <path d="M34 52 Q52 60 58 90" fill="none" stroke="#a89d8b" strokeWidth="2" />
      <path d="M24 70 Q40 66 48 74" fill="none" stroke="#e2dbcd" strokeWidth="2.4" />
    </g>
  ),
  grasstuft: (
    <g stroke="#6aa84a" strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M50 94 Q42 62 28 44" />
      <path d="M50 94 Q50 58 46 26" />
      <path d="M50 94 Q60 62 74 42" />
      <path d="M50 94 Q38 70 22 66" stroke="#8fc96b" strokeWidth="4" />
      <path d="M50 94 Q64 72 80 70" stroke="#8fc96b" strokeWidth="4" />
    </g>
  ),
  wildflower: (
    <g>
      <g stroke="#6aa84a" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M34 94 Q30 66 26 46" />
        <path d="M52 94 Q52 62 54 34" />
        <path d="M70 94 Q74 68 76 52" />
      </g>
      <g stroke={OUTLINE} strokeWidth="1.6">
        <circle cx="26" cy="42" r="9" fill="#ffd9e8" />
        <circle cx="54" cy="30" r="10" fill="#fff3c4" />
        <circle cx="76" cy="48" r="8" fill="#d9d2f2" />
      </g>
      <g fill="#f0a468" stroke="none">
        <circle cx="26" cy="42" r="3" />
        <circle cx="54" cy="30" r="3.4" />
        <circle cx="76" cy="48" r="2.6" />
      </g>
    </g>
  ),
  stump: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M28 92 L32 50 L68 50 L72 92 Z" fill="#a97f52" />
      <ellipse cx="50" cy="50" rx="20" ry="8" fill="#c79c6e" />
      <ellipse cx="50" cy="50" rx="12" ry="4.6" fill="none" stroke="#a97f52" strokeWidth="1.8" />
      <ellipse cx="50" cy="50" rx="5" ry="2" fill="none" stroke="#a97f52" strokeWidth="1.6" />
      <path d="M30 70 Q22 64 18 72 Q24 78 32 76" fill="#8fc96b" />
    </g>
  ),
  wateringcan: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M30 92 L26 52 L70 52 L66 92 Z" fill="#9fd3c7" />
      <rect x="22" y="44" width="52" height="9" rx="4" fill="#b6e0d6" />
      <path d="M70 58 L88 38 L94 44 L78 64 Z" fill="#b6e0d6" />
      <path d="M38 44 Q50 22 62 44" fill="none" stroke="#7fb9ac" strokeWidth="5" />
    </g>
  ),
  signpost: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <rect x="45" y="36" width="10" height="58" fill="#a97f52" />
      <path d="M16 30 L74 30 L86 44 L74 58 L16 58 Z" fill="#e8d6ae" />
      <g stroke="#b99a6a" strokeWidth="2.4" strokeLinecap="round">
        <path d="M26 40 L62 40" />
        <path d="M26 48 L52 48" />
      </g>
    </g>
  ),
  flowerpot: (
    <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M32 58 L38 94 L62 94 L68 58 Z" fill="#d98b63" />
      <rect x="28" y="50" width="44" height="10" rx="3" fill="#e69c74" />
      <path d="M50 50 L50 30" stroke="#6aa84a" strokeWidth="3.4" strokeLinecap="round" />
      <g fill="#ffd9e8">
        <circle cx="42" cy="26" r="9" />
        <circle cx="60" cy="30" r="8" />
        <circle cx="52" cy="16" r="8" />
      </g>
      <circle cx="51" cy="24" r="3.5" fill="#ffd166" stroke="none" />
    </g>
  ),
}
