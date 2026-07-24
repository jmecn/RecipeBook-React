import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getEmiRendererClient, type IconMountSession } from '../../../adapters/emi-renderer/client'

interface RecipeTooltipProps {
  recipeId: string
  x: number
  y: number
  visible: boolean
}

export function RecipeTooltip({ recipeId, x, y, visible }: RecipeTooltipProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sessionRef = useRef<IconMountSession | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !visible) return

    host.replaceChildren()

    const stage = document.createElement('div')
    stage.className = 'calc-recipe-tooltip-stage'
    stage.dataset.recipeId = recipeId
    host.appendChild(stage)

    const footer = document.createElement('div')
    footer.className = 'calc-recipe-tooltip-footer'
    const idEl = document.createElement('p')
    idEl.className = 'calc-recipe-tooltip-id'
    idEl.title = recipeId
    idEl.textContent = recipeId
    footer.appendChild(idEl)
    host.appendChild(footer)

    const client = getEmiRendererClient()
    const session = client.mountRecipeCard(stage, { recipeId })
    sessionRef.current = session

    return () => {
      sessionRef.current?.disconnect()
      sessionRef.current = null
    }
  }, [recipeId, visible])

  if (!visible) return null

  return createPortal(
    <div
      ref={hostRef}
      className="calc-recipe-tooltip"
      style={{
        left: x,
        top: y,
      }}
    />,
    document.body,
  )
}
