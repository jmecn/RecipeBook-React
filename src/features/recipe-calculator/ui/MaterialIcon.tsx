import { useEffect, useRef } from 'react'
import { getEmiRendererClient, type IconMountSession } from '../../../adapters/emi-renderer/client'

interface MaterialIconProps {
  itemId: string
  bundleId: string
  baseUrl: string
  locale: string
  className?: string
  isTag?: boolean
}

export function MaterialIcon({
  itemId,
  bundleId,
  baseUrl,
  locale,
  className = 'calc-tree-icon',
  isTag = false,
}: MaterialIconProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null)
  const sessionRef = useRef<IconMountSession | null>(null)
  const tagMarkRef = useRef<HTMLSpanElement | null>(null)

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

  useEffect(() => {
    if (!isTag || !tagMarkRef.current || !baseUrl) return
    const client = getEmiRendererClient()
    const renderer = client.getRenderer()
    if (!renderer) return
    const url = renderer.resolveResourceUrl('textures/emi/textures/gui/widgets.png')
    if (url) {
      tagMarkRef.current.style.backgroundImage = `url("${url}")`
    }
  }, [isTag, baseUrl])

  return (
    <span className={`${className}${isTag ? ' is-tag-material' : ''}`}>
      <span ref={hostRef} className="calc-tree-icon-inner" />
      {isTag && <span ref={tagMarkRef} className="emi-slot-tag-mark" />}
    </span>
  )
}
