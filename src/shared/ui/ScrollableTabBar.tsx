import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'

interface ScrollableTabBarProps {
  className?: string
  children: ReactNode
}

export function ScrollableTabBar({ className = '', children }: ScrollableTabBarProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  const scrollBy = useCallback((amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }, [])

  return (
    <div className={`calc-tabs-scroll-wrap ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          className="calc-tabs-scroll-btn calc-tabs-scroll-left"
          onClick={() => scrollBy(-200)}
          aria-label={t('scrollLeft')}
        >
          {'\u25C0'}
        </button>
      )}
      <div ref={scrollRef} className="calc-tabs-scroll-inner">
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="calc-tabs-scroll-btn calc-tabs-scroll-right"
          onClick={() => scrollBy(200)}
          aria-label={t('scrollRight')}
        >
          {'\u25B6'}
        </button>
      )}
    </div>
  )
}
