import type { Mood } from '../types'
import { MOOD_META } from '../lib/mood'

interface CharacterProps {
  mood: Mood
  /** 픽셀 단위 한 변 길이 */
  size?: number
  className?: string
}

/**
 * 감정에 따라 몸 색상 / 눈 / 입 모양이 바뀌는 SVG 캐릭터.
 * viewBox 100x100 기준으로 좌표를 잡아 size만 바꿔 쓸 수 있게 했다.
 */
export function Character({ mood, size = 96, className }: CharacterProps) {
  const { body, shade, label } = MOOD_META[mood]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} 캐릭터`}
      className={className}
    >
      {/* 그림자 */}
      <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,0.12)" />

      {/* 몸통 */}
      <circle cx="50" cy="52" r="34" fill={body} stroke={shade} strokeWidth="3" />

      {/* 감정 표시용 더듬이 / 뿔 */}
      {mood === 'happy' && (
        <path d="M50 18 L50 6" stroke={shade} strokeWidth="3" strokeLinecap="round" />
      )}
      {mood === 'happy' && <circle cx="50" cy="5" r="4" fill={shade} />}
      {mood === 'angry' && (
        <>
          <path d="M30 24 L24 12 L38 19 Z" fill={shade} />
          <path d="M70 24 L76 12 L62 19 Z" fill={shade} />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx="76" cy="40" r="3.5" fill="#5aa9d6" />
          <circle cx="80" cy="50" r="2.5" fill="#5aa9d6" opacity="0.7" />
        </>
      )}

      <Eyes mood={mood} shade={shade} />
      <Mouth mood={mood} shade={shade} />

      {/* 볼터치 */}
      {mood === 'happy' && (
        <>
          <circle cx="30" cy="60" r="5" fill="#ff9aa2" opacity="0.6" />
          <circle cx="70" cy="60" r="5" fill="#ff9aa2" opacity="0.6" />
        </>
      )}

      {/* 발 */}
      <ellipse cx="38" cy="86" rx="8" ry="5" fill={shade} />
      <ellipse cx="62" cy="86" rx="8" ry="5" fill={shade} />
    </svg>
  )
}

function Eyes({ mood, shade }: { mood: Mood; shade: string }) {
  switch (mood) {
    case 'happy':
      // 웃는 눈 (^ ^)
      return (
        <g stroke="#3a3a3a" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M33 46 Q38 40 43 46" />
          <path d="M57 46 Q62 40 67 46" />
        </g>
      )
    case 'sad':
      // 처진 눈 + 눈물 방울
      return (
        <g>
          <circle cx="38" cy="46" r="4" fill="#3a3a3a" />
          <circle cx="62" cy="46" r="4" fill="#3a3a3a" />
          <g stroke="#3a3a3a" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M32 39 Q38 36 44 40" />
            <path d="M56 40 Q62 36 68 39" />
          </g>
          <path d="M38 52 q3 6 0 8 q-3 -2 0 -8" fill={shade} />
        </g>
      )
    case 'angry':
      // 치켜뜬 눈썹 + 작은 눈
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="4" strokeLinecap="round">
            <path d="M31 38 L45 44" />
            <path d="M69 38 L55 44" />
          </g>
          <circle cx="39" cy="50" r="3.5" fill="#3a3a3a" />
          <circle cx="61" cy="50" r="3.5" fill="#3a3a3a" />
        </g>
      )
    default:
      // 무표정: 동그란 눈
      return (
        <g fill="#3a3a3a">
          <circle cx="38" cy="47" r="4" />
          <circle cx="62" cy="47" r="4" />
        </g>
      )
  }
}

function Mouth({ mood, shade }: { mood: Mood; shade: string }) {
  switch (mood) {
    case 'happy':
      return <path d="M40 60 Q50 70 60 60" stroke="#3a3a3a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    case 'sad':
      return <path d="M40 66 Q50 58 60 66" stroke="#3a3a3a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    case 'angry':
      return (
        <path
          d="M40 65 L45 61 L50 65 L55 61 L60 65"
          stroke="#3a3a3a"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    default:
      return <path d="M42 63 L58 63" stroke="#3a3a3a" strokeWidth="3.5" strokeLinecap="round" fill={shade} />
  }
}
