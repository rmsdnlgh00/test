import { useMemo, useState } from 'react'
import type { CatalogItem, Inventory, ItemType, Wallet } from '../types'
import { CATALOG, CURRENCY_ICON, CURRENCY_NAME, TIER_LABEL, isOnSale } from '../data/catalog'
import { formatMonth } from '../lib/date'
import { Sheet } from '../components/Sheet'
import { Character } from '../components/Character'
import { DecorSprite } from '../components/DecorSprite'
import './screens.css'

interface ShopProps {
  open: boolean
  month: string
  wallet: Wallet
  inventory: Inventory
  onBuy: (itemId: string) => boolean
  onClose: () => void
}

/** 상점 (스펙 9장). 구매하면 창고에 들어가고, 착용·배치는 꾸미기에서 따로 한다. */
export function Shop({ open, month, wallet, inventory, onBuy, onClose }: ShopProps) {
  const [tab, setTab] = useState<ItemType>('outfit')

  const items = useMemo(
    () => CATALOG.filter((item) => item.type === tab && isOnSale(item, month)),
    [tab, month],
  )

  const owns = (item: CatalogItem) =>
    item.type === 'outfit'
      ? inventory.ownedOutfits.includes(item.id)
      : inventory.ownedDecor.includes(item.id)

  return (
    <Sheet
      open={open}
      title="상점"
      onClose={onClose}
      aside={
        <span className="wallet-chip">
          {CURRENCY_ICON} {wallet.balance}
        </span>
      }
    >
      <div className="tabs" role="tablist">
        <button
          className={`tabs__tab${tab === 'outfit' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'outfit'}
          onClick={() => setTab('outfit')}
        >
          의상
        </button>
        <button
          className={`tabs__tab${tab === 'decor' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'decor'}
          onClick={() => setTab('decor')}
        >
          소품
        </button>
      </div>

      <p className="screen__hint">
        {formatMonth(month)}에 살 수 있는 물건입니다. 시즌 한정은 이번 달이 지나면 사라져요.
      </p>

      <ul className="cards">
        {items.map((item) => {
          const owned = owns(item)
          const affordable = wallet.balance >= item.price
          return (
            <li key={item.id} className="card">
              <div className="card__art">
                {item.type === 'outfit' ? (
                  <Character mood="neutral" outfit={item} className="card__sprite" />
                ) : (
                  <DecorSprite art={item.art} className="card__sprite" />
                )}
              </div>
              <div className="card__info">
                <span className={`badge badge--${item.tier}`}>{TIER_LABEL[item.tier]}</span>
                <strong className="card__name">{item.name}</strong>
                <span className="card__price">
                  {item.price === 0 ? '무료' : `${CURRENCY_ICON} ${item.price}`}
                </span>
              </div>
              <button
                className="btn btn--small display"
                type="button"
                disabled={owned || !affordable}
                onClick={() => onBuy(item.id)}
              >
                {owned ? '보유 중' : affordable ? '구매' : `${CURRENCY_NAME} 부족`}
              </button>
            </li>
          )
        })}
      </ul>

      {items.length === 0 && <p className="screen__empty">이번 달에는 내놓은 물건이 없어요.</p>}
    </Sheet>
  )
}
