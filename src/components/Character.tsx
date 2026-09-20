import type { AgentActivity, BottomShape, Mood, OutfitItem, TopShape } from '../types'
import './Character.css'

interface CharacterProps {
  mood: Mood
  /** 입고 있는 상의 */
  top?: OutfitItem
  /** 입고 있는 하의 */
  bottom?: OutfitItem
  activity?: AgentActivity
  /** 1이면 오른쪽을 본다 */
  facing?: 1 | -1
  /** 픽셀 크기. 생략하면 부모 크기에 맞춘다. */
  size?: number
  className?: string
}

const SKIN = '#f6d7b8'
const SKIN_SHADE = '#dcae87'
const HAIR = '#6b4a34'
const HAIR_LIGHT = '#84604a'
const SHOE = '#5f4a3a'

/** 옷을 벗겨 둔 칸에 입히는 무채색 기본 옷. 맨몸이 나오지 않게 한다. */
const BARE_TOP = { color: '#f2ece1', shade: '#c9bfae' }
const BARE_BOTTOM = { color: '#d8d0c2', shade: '#aa9f8c' }

/**
 * 캐릭터 SVG — 머리·몸통·팔다리를 갖춘 사람 모양.
 *
 * 스펙 1장 원칙: 감정은 '표정'(눈·눈썹·입)에만 반영한다.
 * 몸과 얼굴 생김새는 모두가 같고, 달라지는 건 입은 옷뿐이다.
 * 슬픈 일기를 썼다고 캐릭터가 다르게 생기거나 더 좋아 보이는 일이 없다.
 *
 * 좌표는 viewBox 100×100 기준으로, 발바닥이 y≈92 에 오도록 잡혀 있다.
 * Stage 의 CHARACTER_FOOT_INSET(7)이 이 값과 짝이다.
 */
export function Character({
  mood,
  top,
  bottom,
  activity = 'idle',
  facing = 1,
  size,
  className,
}: CharacterProps) {
  const topColor = top?.color ?? BARE_TOP.color
  const topShade = top?.shade ?? BARE_TOP.shade
  const bottomColor = bottom?.color ?? BARE_BOTTOM.color
  const bottomShade = bottom?.shade ?? BARE_BOTTOM.shade
  const topShape = (top?.shape ?? 'tee') as TopShape
  const bottomShape = (bottom?.shape ?? 'shorts') as BottomShape

  const sitting = activity === 'sitting'
  // 치마는 다리를 덮으므로 바짓단을 그리지 않는다.
  const legWear = bottomShape === 'skirt' ? 0 : bottomShape === 'shorts' ? 8 : 20
  const sleeveLong = topShape !== 'tee'

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
      <ellipse className="char__shadow" cx="50" cy="94" rx="19" ry="3.8" fill="rgba(60,80,40,0.22)" />

      {!sitting && (
        <>
          {/* 다리 — 맨다리 위에 바짓단을 겹쳐 입힌다. 걷기 애니메이션이 이 묶음을 흔든다. */}
          <g className="char__legs">
            <g className="char__leg char__leg--l">
              <rect x="41" y="64" width="7.5" height="26" rx="3.7" fill={SKIN} />
              {legWear > 0 && (
                <rect x="40.4" y="64" width="8.7" height={legWear} rx="3.4" fill={bottomColor} />
              )}
            </g>
            <g className="char__leg char__leg--r">
              <rect x="51.5" y="64" width="7.5" height="26" rx="3.7" fill={SKIN} />
              {legWear > 0 && (
                <rect x="50.9" y="64" width="8.7" height={legWear} rx="3.4" fill={bottomColor} />
              )}
            </g>
          </g>

          <g className="char__feet" fill={SHOE}>
            <ellipse className="char__foot char__foot--l" cx="44.5" cy="90.5" rx="6.6" ry="3.4" />
            <ellipse className="char__foot char__foot--r" cx="55.5" cy="90.5" rx="6.6" ry="3.4" />
          </g>
        </>
      )}

      <g className="char__body-group">
        {/* 하의 허리 — 움직이는 다리 위쪽을 덮어 이음매를 가린다 */}
        <Bottom shape={bottomShape} color={bottomColor} shade={bottomShade} sitting={sitting} />

        {/* 앉은 다리는 무릎 담요 같은 하의 '위'로 나와야 보인다 */}
        {sitting && <SeatedLegs color={bottomColor} covered={bottomShape === 'pants'} />}

        {/* 뒤쪽 팔은 몸통보다 먼저 */}
        <Arm
          side="l"
          color={sleeveLong ? topColor : SKIN}
          cuff={sleeveLong ? topShade : SKIN_SHADE}
        />

        <Top shape={topShape} color={topColor} shade={topShade} />

        <Arm
          side="r"
          color={sleeveLong ? topColor : SKIN}
          cuff={sleeveLong ? topShade : SKIN_SHADE}
        />

        {/* 목 */}
        <rect x="46" y="34" width="8" height="8" rx="3" fill={SKIN_SHADE} />

        <Head />
        <Face mood={mood} />
      </g>
    </svg>
  )
}

/**
 * 벤치에 앉은 다리.
 *
 * 서 있는 다리를 CSS 로 통째로 돌려 쓰던 예전 방식은, 접힌 다리가 몸통 뒤로
 * 들어가 아예 보이지 않았다. 앉은 자세는 아예 다른 그림이라 따로 그린다.
 *
 * 정면에서 보면 허벅지는 앞으로 접혀 짧아 보이고(원근 단축) 종아리만 바닥으로
 * 내려간다. 무릎을 좌우로 조금 벌려야 다리 두 짝이 겹치지 않고 읽힌다.
 * 허리 높이는 scene.ts 의 BENCH_SEAT 과 짝이다.
 */
function SeatedLegs({ color, covered }: { color: string; covered: boolean }) {
  // body-group 이 아래로 6 내려간 뒤를 기준으로 잡은 좌표다.
  const leg = (side: -1 | 1) => {
    const x = 50 + side * 11
    return (
      <g key={side}>
        {/* 종아리 — 허벅지는 무릎 위 하의가 대신한다(정면이라 앞으로 접혀 안 보인다) */}
        <path
          d={`M${x} 71 L${x} 84`}
          stroke={SKIN}
          strokeWidth="8.4"
          strokeLinecap="round"
          fill="none"
        />
        {/* 바지는 정강이 중간까지 내려온다. 치마·반바지는 맨다리 그대로 */}
        {covered && (
          <path
            d={`M${x} 70 L${x} 78`}
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
        )}
        <ellipse cx={x} cy="86.5" rx="6.4" ry="3.3" fill={SHOE} />
      </g>
    )
  }

  return <g className="char__legs">{[leg(-1), leg(1)]}</g>
}

function Head() {
  return (
    <g>
      {/* 뒷머리가 얼굴보다 조금 넓어야 머리통으로 읽힌다 */}
      <ellipse cx="50" cy="23" rx="16.5" ry="16" fill={HAIR} />
      <circle cx="50" cy="24" r="14.5" fill={SKIN} />
      <ellipse cx="35.8" cy="26" rx="2.6" ry="3.2" fill={SKIN} />
      <ellipse cx="64.2" cy="26" rx="2.6" ry="3.2" fill={SKIN} />
      {/* 앞머리 */}
      <path
        d="M35.8 22 Q37 9 50 9 Q63 9 64.2 22 Q58 15 50 16.5 Q42 15 35.8 22 Z"
        fill={HAIR}
      />
      <path d="M44 11 Q52 10 58 14" stroke={HAIR_LIGHT} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** 소매와 손. 걷을 때 어깨를 축으로 흔들린다. */
function Arm({ side, color, cuff }: { side: 'l' | 'r'; color: string; cuff: string }) {
  const shoulderX = side === 'l' ? 38 : 62
  const handX = side === 'l' ? 34 : 66

  return (
    <g className={`char__arm char__arm--${side}`}>
      <path
        d={`M${shoulderX} 45 Q${handX} 54 ${handX} 62`}
        stroke={color}
        strokeWidth="6.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={handX} cy={63.5} r="3.4" fill={SKIN} stroke={cuff} strokeWidth="0.6" />
    </g>
  )
}

/** 상의. 모양마다 실루엣이 달라야 갈아입은 게 눈에 보인다. */
function Top({ shape, color, shade }: { shape: TopShape; color: string; shade: string }) {
  const body = (
    <path
      d="M40 42 Q50 39.5 60 42 L64 47 Q65 57 63.5 66 Q50 69 36.5 66 Q35 57 36 47 Z"
      fill={color}
      stroke={shade}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  )

  switch (shape) {
    case 'hoodie':
      return (
        <g>
          {/* 목 뒤로 넘어간 모자 */}
          <path d="M39 40 Q50 50 61 40 Q56 34 50 34 Q44 34 39 40 Z" fill={shade} />
          {body}
          {/* 앞주머니와 끈 */}
          <path d="M42 57 L58 57 L56.5 63 L43.5 63 Z" fill={shade} opacity="0.35" />
          <path d="M47 44 L47 50 M53 44 L53 50" stroke={shade} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )
    case 'knit':
      return (
        <g>
          {body}
          {/* 니트 짜임 — 세로 골과 밑단 고무단 */}
          <g stroke={shade} strokeWidth="1" opacity="0.5">
            <path d="M43 45 L43 63 M50 44 L50 64 M57 45 L57 63" />
          </g>
          <path d="M37 62 Q50 65 63 62 L63.5 66 Q50 69 36.5 66 Z" fill={shade} opacity="0.45" />
          <path d="M43 42 Q50 47 57 42" stroke={shade} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return (
        <g>
          {body}
          {/* 둥근 목선 */}
          <path d="M44 41.5 Q50 46 56 41.5" stroke={shade} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )
  }
}

/** 하의의 허리 부분. 바지·반바지는 바짓단을 다리 쪽에서 따로 그린다. */
function Bottom({
  shape,
  color,
  shade,
  sitting = false,
}: {
  shape: BottomShape
  color: string
  shade: string
  sitting?: boolean
}) {
  /*
   * 앉으면 허벅지가 앞으로 접혀 정면에서는 보이지 않는다. 그래서 하의도 종류를
   * 가리지 않고 무릎 위를 덮는 한 덩어리가 된다 — 서 있을 때의 긴 치마·바지를
   * 그대로 두면 종아리를 전부 덮어 다리가 사라진다.
   */
  if (sitting) {
    return (
      <g>
        <path
          d="M39.5 58 L60.5 58 Q67 66 66 71.5 Q50 75 34 71.5 Q33 66 39.5 58 Z"
          fill={color}
          stroke={shade}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* 무릎 위로 지는 그늘 — 앉은 면이 앞으로 꺾인 걸 보여 준다 */}
        <path
          d="M34.4 68.5 Q50 72 65.6 68.5 Q66.2 70.2 66 71.5 Q50 75 34 71.5 Q33.8 70.2 34.4 68.5 Z"
          fill={shade}
          opacity="0.35"
        />
      </g>
    )
  }

  if (shape === 'skirt') {
    return (
      <g>
        <path
          d="M39.5 62 L60.5 62 L67 80 Q50 83.5 33 80 Z"
          fill={color}
          stroke={shade}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* 밑단 그늘 */}
        <path d="M34.5 77 Q50 80.5 65.5 77 L67 80 Q50 83.5 33 80 Z" fill={shade} opacity="0.35" />
      </g>
    )
  }

  return (
    <g>
      <path
        d="M38.5 60 L61.5 60 L61 70 Q50 72.5 39 70 Z"
        fill={color}
        stroke={shade}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* 허리 벨트 */}
      <rect x="38.3" y="60" width="23.4" height="3.4" rx="1.7" fill={shade} opacity="0.45" />
      {/* 가랑이 선 */}
      <path d="M50 66 L50 71" stroke={shade} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

/** 감정이 드러나는 유일한 곳. 머리(중심 50,24 / 반지름 14.5)에 맞춰 그린다. */
function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M40.5 25 Q44 21 47.5 25" />
            <path d="M52.5 25 Q56 21 59.5 25" />
            <path d="M45.5 30.5 Q50 35 54.5 30.5" />
          </g>
          <g fill="#ff9aa2" opacity="0.5">
            <circle cx="38.5" cy="29.5" r="3.2" />
            <circle cx="61.5" cy="29.5" r="3.2" />
          </g>
        </g>
      )
    case 'sad':
      return (
        <g>
          <circle cx="44" cy="25" r="2.5" fill="#3a3a3a" />
          <circle cx="56" cy="25" r="2.5" fill="#3a3a3a" />
          <g stroke="#3a3a3a" strokeWidth="1.9" strokeLinecap="round" fill="none">
            <path d="M40 20 Q44 18 48 20.5" />
            <path d="M52 20.5 Q56 18 60 20" />
            <path d="M46 33.5 Q50 30 54 33.5" />
          </g>
          <path d="M44 28.5 q2 3.5 0 4.6 q-2 -1.1 0 -4.6" fill="#8ecae6" />
        </g>
      )
    case 'angry':
      return (
        <g>
          <g stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round">
            <path d="M39.5 19.5 L47 23" />
            <path d="M60.5 19.5 L53 23" />
          </g>
          <circle cx="44.5" cy="26.5" r="2.3" fill="#3a3a3a" />
          <circle cx="55.5" cy="26.5" r="2.3" fill="#3a3a3a" />
          <path
            d="M45 32.5 L47.5 30.5 L50 32.5 L52.5 30.5 L55 32.5"
            stroke="#3a3a3a"
            strokeWidth="2"
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
            <circle cx="44" cy="25.5" r="2.5" />
            <circle cx="56" cy="25.5" r="2.5" />
          </g>
          <path d="M46.5 31.5 L53.5 31.5" stroke="#3a3a3a" strokeWidth="2.1" strokeLinecap="round" />
        </g>
      )
  }
}
