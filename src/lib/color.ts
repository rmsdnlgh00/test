/**
 * 색 계산. 계절 팔레트가 어떤 색이든 같은 규칙으로 파생색을 뽑아내야 해서,
 * 색을 하나하나 손으로 적지 않고 여기서 섞는다.
 */

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ]
}

const toHex = (n: number) => clamp255(n).toString(16).padStart(2, '0')

/** a 위에 b 를 amount(0~1) 만큼 올렸을 때의 색. SVG 에서 반투명으로 덮은 것과 같아진다. */
export function mixHex(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const t = Math.max(0, Math.min(1, amount))
  return `#${toHex(ar + (br - ar) * t)}${toHex(ag + (bg - ag) * t)}${toHex(ab + (bb - ab) * t)}`
}
