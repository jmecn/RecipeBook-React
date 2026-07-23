import { getEmiRendererClient } from '../../../adapters/emi-renderer/client'

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
  const client = getEmiRendererClient()

  return (
    <span
      className={className}
      ref={(el) => {
        if (!el || !bundleId) return
        if (el.children.length > 0) return
        client.mountItemIcon(el, {
          itemId,
          baseUrl,
          locale,
          fallbackText: itemId.slice(0, 4),
        })
      }}
    />
  )
}