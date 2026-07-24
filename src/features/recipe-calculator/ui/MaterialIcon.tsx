import { useEffect, useRef } from 'react'
import { getEmiRendererClient, type IconMountSession } from '../../../adapters/emi-renderer/client'

interface MaterialIconProps {
  itemId: string
  bundleId: string
  baseUrl: string
  locale: string
  className?: string
}

export function MaterialIcon({
  itemId,
  bundleId,
  baseUrl,
  locale,
  className = 'calc-tree-icon',
}: MaterialIconProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null)
  const sessionRef = useRef<IconMountSession | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !bundleId) return

    const client = getEmiRendererClient()
    const session = client.mountItemIcon(host, {
      itemId,
      baseUrl,
      locale,
      fallbackText: itemId.slice(0, 4),
    })
    sessionRef.current = session

    return () => {
      session.disconnect()
      sessionRef.current = null
    }
  }, [itemId, bundleId, baseUrl, locale])

  return <span ref={hostRef} className={className} />
}
