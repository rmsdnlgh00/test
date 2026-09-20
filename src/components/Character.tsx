import type { AgentActivity, Mood, OutfitItem } from '../types'
import './Character.css'

interface CharacterProps {
  mood: Mood
  outfit?: OutfitItem
  activity?: AgentActivity
  /** 1이면 오른쪽을 본다 */
  facing?: 1 | -1
  /** 픽셀 크기. 생략하면 부모 크기에 맞춘다. */
  size?: number
  className?: string
}

/** 옷을 입지 않았을 때의 기본 몸 색. */
const BARE = { color: '#f6e3c5', shade: '#c9a87c' }

/**
 * 캐릭터 SVG.
 *
 * 스펙 1장 원칙: 감정은 '표정'(눈·눈썹·입)에만 반영한다.
 * 몸 색과 머리 장식은 전적으로 의상이 결정하므로, 슬픈 일기를 썼다고
 * 캐릭터가 다르게 생기거나 더 좋아 보이는 일이 없다.
 */
export function Character({
  mood,
  outfit,
  activity = 'idle',
  facing = 1,
  size,
  className,
}: CharacterProps) {
  const color = outfit?.color ?? BARE.color
  const shade = outfit?.shade ?? BARE.shade
  const sitting = activity === 'sitting'

  const classes = [
    'char',
    activity === 'walking' ? 'char--walking' : '',
    sitting ? 'char--sitting' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={classes}
      role="img"
      aria-label="캐릭터"
      style={{ transform: facing === -1 ? 'scaleX(-1)' : undefined }}
    >
      <ellipse className="char__shadow" cx="50" cy="93" rx="24" ry="4.5" fill="rgba(60,80,40,0.2)" />

      <g className="char__legs" stroke={shade} strokeWidth="6" strokeLinecap="round">
        <line className="char__leg char__leg--l" x1="41" y1="78" x2="41" y2="89" />
        <line className="char__leg char__leg--r" x1="59" y1="78" x2="59" y2="89" />
      </g>

      <g className="char__body-group">
        <g stroke={shade} strokeWidth="5.5" strokeLinecap="round">
          <line className="char__arm char__arm--l" x1="20" y1="54" x2="14" y2="64" />
          <line className="char__arm char__arm--r" x1="80" y1="54" x2="86" y2="64" />
        </g>

        <circle cx="50" cy="50" r="32" fill={color} stroke={shade} strokeWidth="3" />

        {outfit && <Hat hat={outfit.hat} shade={outfit.shade} />}

        <Face mood={mood} />
      </g>

      <g className="char__feet" fill={shade}>
        <ellipse className="char__foot char__foot--l" cx="41" cy="90" rx="7.5" ry="4" />
        <ellipse className="char__foot char__foot--r" cx="59" cy="90" rx="7.5" ry="4" />
      </g>
    </svg>
  )
}

function Hat({ hat, shade }: { hat: OutfitItem['hat']; shade: string }) {
  switch (hat) {
    case 'leaf':
      return (
        <g>
          <path d="M50 20 Q44 8 52 4 Q60 10 54 20 Z" fill="#8fc96b" stroke={shade} strokeWidth="1.6" />
          <path d="M52 6 L52 18" stroke={shade} strokeWidth="1.2" />
        </g>
      )
    case 'beanie':
      return (
        <g>
          <path d="M28 30 Q50 4 72 30 Z" fill={shade} />
          <rect x="26" y="28" width="48" height="7" rx="3.5" fill={shade} opacity="0.75" />
          <circle cx="50" cy="8" r="5" fill={shade} />
        </g>
      )
    case 'flower':
      return (
        <g>
          <g fill="#ffd9e8" stroke={shade} strokeWidth="1.2">
            <circle cx="44" cy="20" r="4.5" />
            <circle cx="53" cy="17" r="4.5" />
            <circle cx="49" cy="25" r="4.5" />
          </g>
          <circle cx="49" cy="21" r="2.4" fill="#ffd166" />
        </g>
      )
    default:
      return null
  }
}

/** 감정이 드러나는 유일한 곳. */
function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M34 46 Q39 40 44 46" />
            <path d="M56 46 Q61 40 66 46" />
            <path d="M41 58 Q50 68 59 58" />
          </g>
          <g fill="#ff9aa2" opacity="0.5">
            <circle cx="31" cy="57" r="5" />
            <circle cx="69" cy="57" r="5" />
          </g>
        </g>
      )
    case 'sad':
      return (
        <g>
          <circle cx="39" cy="46" r="4" fill="#3a3a3a" />
          <circle cx="61" cy="46" r="4" fill="#3a3a3a" />
          <g stroke="#3a3a3a" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M33 39 Q39 36 45 40" />
            <path d="M55 40 Q61 36 67 39" />
            <path d="M41 65 Q50 58 59 65" />
          </g>
          <path d="M39 52 q3 6 0 8 q-3 -2 0 -8" fill="#8ecae6" />
        </g>
      )
    case 'angry':
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="4" strokeLinecap="round">
            <path d="M32 38 L46 44" />
            <path d="M68 38 L54 44" />
          </g>
          <circle cx="40" cy="50" r="3.5" fill="#3a3a3a" />
          <circle cx="60" cy="50" r="3.5" fill="#3a3a3a" />
          <path
            d="M41 64 L46 60 L50 64 L55 60 L59 64"
            stroke="#3a3a3a"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )
    default:
      return (
        <g>
          <g fill="#3a3a3a">
            <circle cx="39" cy="47" r="4" />
            <circle cx="61" cy="47" r="4" />
          </g>
          <path d="M43 62 L57 62" stroke="#3a3a3a" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )
  }
}
