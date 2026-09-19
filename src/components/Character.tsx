import type { Mood } from '../types'
import { MOOD_META } from '../lib/mood'
import './Character.css'

interface CharacterProps {
  mood: Mood
  /** 픽셀 단위 한 변 길이. 생략하면 부모 폭에 맞춘다. */
  size?: number
  /** true면 다리·팔이 번갈아 움직이는 걷기 프레임이 돈다. */
  walking?: boolean
  className?: string
}

/**
 * 감정에 따라 몸 색상 / 눈 / 입 모양이 바뀌는 SVG 캐릭터.
 * viewBox 100x100 기준이라 size만 바꿔 어디서든 재사용한다.
 */
export function Character({ mood, size, walking = false, className }: CharacterProps) {
  const { body, shade, label } = MOOD_META[mood]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} 캐릭터`}
      className={['char', walking ? 'char--walking' : '', className].filter(Boolean).join(' ')}
    >
      {/* 그림자 — 걸을 때 살짝 줄었다 커진다 */}
      <ellipse className="char__shadow" cx="50" cy="93" rx="24" ry="4.5" fill="rgba(60,80,40,0.18)" />

      {/* 다리 */}
      <g className="char__legs" stroke={shade} strokeWidth="6" strokeLinecap="round">
        <line className="char__leg char__leg--l" x1="41" y1="78" x2="41" y2="89" />
        <line className="char__leg char__leg--r" x1="59" y1="78" x2="59" y2="89" />
      </g>

      <g className="char__body-group">
        {/* 팔 */}
        <g stroke={shade} strokeWidth="5.5" strokeLinecap="round">
          <line className="char__arm char__arm--l" x1="20" y1="54" x2="14" y2="64" />
          <line className="char__arm char__arm--r" x1="80" y1="54" x2="86" y2="64" />
        </g>

        {/* 몸통 */}
        <circle cx="50" cy="50" r="32" fill={body} stroke={shade} strokeWidth="3" />

        {/* 감정 표시용 더듬이 / 뿔 / 물방울 */}
        {mood === 'happy' && (
          <g className="char__antenna">
            <path d="M50 19 L50 8" stroke={shade} strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="6" r="4" fill={shade} />
          </g>
        )}
        {mood === 'angry' && (
          <>
            <path d="M31 24 L25 12 L39 19 Z" fill={shade} />
            <path d="M69 24 L75 12 L61 19 Z" fill={shade} />
          </>
        )}
        {mood === 'sad' && (
          <>
            <circle cx="76" cy="38" r="3.5" fill="#5aa9d6" />
            <circle cx="81" cy="48" r="2.5" fill="#5aa9d6" opacity="0.7" />
          </>
        )}

        <Eyes mood={mood} shade={shade} />
        <Mouth mood={mood} />

        {/* 볼터치 */}
        {mood === 'happy' && (
          <g fill="#ff9aa2" opacity="0.55">
            <circle cx="31" cy="58" r="5" />
            <circle cx="69" cy="58" r="5" />
          </g>
        )}
      </g>

      {/* 발 */}
      <g className="char__feet" fill={shade}>
        <ellipse className="char__foot char__foot--l" cx="41" cy="90" rx="7.5" ry="4" />
        <ellipse className="char__foot char__foot--r" cx="59" cy="90" rx="7.5" ry="4" />
      </g>
    </svg>
  )
}

function Eyes({ mood, shade }: { mood: Mood; shade: string }) {
  switch (mood) {
    case 'happy':
      // 웃는 눈 (^ ^)
      return (
        <g stroke="#3a3a3a" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M34 45 Q39 39 44 45" />
          <path d="M56 45 Q61 39 66 45" />
        </g>
      )
    case 'sad':
      // 처진 눈썹 + 눈물 방울
      return (
        <g>
          <circle cx="39" cy="45" r="4" fill="#3a3a3a" />
          <circle cx="61" cy="45" r="4" fill="#3a3a3a" />
          <g stroke="#3a3a3a" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M33 38 Q39 35 45 39" />
            <path d="M55 39 Q61 35 67 38" />
          </g>
          <path d="M39 51 q3 6 0 8 q-3 -2 0 -8" fill={shade} />
        </g>
      )
    case 'angry':
      // 치켜뜬 눈썹 + 작은 눈
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="4" strokeLinecap="round">
            <path d="M32 37 L46 43" />
            <path d="M68 37 L54 43" />
          </g>
          <circle cx="40" cy="49" r="3.5" fill="#3a3a3a" />
          <circle cx="60" cy="49" r="3.5" fill="#3a3a3a" />
        </g>
      )
    default:
      return (
        <g fill="#3a3a3a">
          <circle cx="39" cy="46" r="4" />
          <circle cx="61" cy="46" r="4" />
        </g>
      )
  }
}

function Mouth({ mood }: { mood: Mood }) {
  const common = { stroke: '#3a3a3a', strokeWidth: 3.5, fill: 'none', strokeLinecap: 'round' } as const
  switch (mood) {
    case 'happy':
      return <path d="M41 59 Q50 69 59 59" {...common} />
    case 'sad':
      return <path d="M41 65 Q50 57 59 65" {...common} />
    case 'angry':
      return <path d="M41 64 L46 60 L50 64 L55 60 L59 64" {...common} strokeLinejoin="round" />
    default:
      return <path d="M43 62 L57 62" {...common} />
  }
}
