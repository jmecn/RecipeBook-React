import { useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import type { CalcMaterial } from '../model/types'
import type { CalcTargetSummary } from './CalcTargetTree'
import { MaterialIcon } from './MaterialIcon'
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel'
import { formatMaterialAmount, resolveLabel } from '../lib/utils'

interface MaterialSummaryProps {
  rawMaterials: CalcMaterial[]
  byproducts: CalcMaterial[]
  langLabels: Record<string, string>
  bundleId: string
  baseUrl: string
  locale: string
  targetGroups?: Map<number, CalcTargetSummary>
}

function MaterialCard({
  material,
  langLabels,
  bundleId,
  baseUrl,
  locale,
}: {
  material: CalcMaterial
  langLabels: Record<string, string>
  bundleId: string
  baseUrl: string
  locale: string
}) {
  const label = resolveLabel(langLabels, material.id)
  const amount = formatMaterialAmount(material.kind, material.amount)
  return (
    <div className="calc-material-card" title={material.id}>
      <MaterialIcon
        itemId={material.id}
        bundleId={bundleId}
        baseUrl={baseUrl}
        locale={locale}
        className="calc-material-card-icon"
      />
      <div className="calc-material-card-info">
        <FormattedItemLabel label={label} className="calc-material-card-name" />
        <span className="calc-material-card-amount">×{amount}</span>
      </div>
    </div>
  )
}

function MaterialGrid({
  materials,
  langLabels,
  bundleId,
  baseUrl,
  locale,
}: {
  materials: CalcMaterial[]
  langLabels: Record<string, string>
  bundleId: string
  baseUrl: string
  locale: string
}) {
  if (materials.length === 0) return null
  return (
    <div className="calc-material-group-grid">
      {materials.map((m) => (
        <MaterialCard
          key={`${m.kind}:${m.id}`}
          material={m}
          langLabels={langLabels}
          bundleId={bundleId}
          baseUrl={baseUrl}
          locale={locale}
        />
      ))}
    </div>
  )
}

function TargetGroup({
  summary,
  langLabels,
  bundleId,
  baseUrl,
  locale,
}: {
  summary: CalcTargetSummary
  langLabels: Record<string, string>
  bundleId: string
  baseUrl: string
  locale: string
}) {
  const { t } = useI18n()
  const label = resolveLabel(langLabels, summary.targetItemId)
  const amount = formatMaterialAmount('item', summary.targetAmount)
  return (
    <div className="calc-material-target-group">
      <div className="calc-material-target-header">
        <MaterialIcon
          itemId={summary.targetItemId}
          bundleId={bundleId}
          baseUrl={baseUrl}
          locale={locale}
          className="calc-material-target-icon"
        />
        <span className="calc-material-target-name">
          <FormattedItemLabel label={label} />
        </span>
        <span className="calc-material-target-amount">×{amount}</span>
      </div>
      <div className="calc-material-target-body">
        <MaterialGrid
          materials={summary.rawMaterials}
          langLabels={langLabels}
          bundleId={bundleId}
          baseUrl={baseUrl}
          locale={locale}
        />
        {summary.byproducts.length > 0 && (
          <div className="calc-material-group">
            <div className="calc-material-group-title">{t('materialSummaryByproducts')}</div>
            <MaterialGrid
              materials={summary.byproducts}
              langLabels={langLabels}
              bundleId={bundleId}
              baseUrl={baseUrl}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function MaterialSummary({
  rawMaterials,
  byproducts,
  langLabels,
  bundleId,
  baseUrl,
  locale,
  targetGroups,
}: MaterialSummaryProps) {
  const { t } = useI18n()
  const hasGroups = targetGroups && targetGroups.size > 1
  const [mode, setMode] = useState<'merged' | 'grouped'>(hasGroups ? 'grouped' : 'merged')

  return (
    <div className="calc-material-list">
      <div className="calc-material-list-header">
        <span className="calc-material-list-title">{t('materialSummaryTitle')}</span>
        {hasGroups && (
          <div className="calc-material-mode-toggle">
            <button
              type="button"
              className={mode === 'merged' ? 'is-active' : ''}
              onClick={() => setMode('merged')}
              title={t('materialSummaryMerged')}
            >
              {'\u229E'}
            </button>
            <button
              type="button"
              className={mode === 'grouped' ? 'is-active' : ''}
              onClick={() => setMode('grouped')}
              title={t('materialSummaryByTarget')}
            >
              {'\u2630'}
            </button>
          </div>
        )}
      </div>

      {mode === 'merged' ? (
        <>
          <MaterialGrid
            materials={rawMaterials}
            langLabels={langLabels}
            bundleId={bundleId}
            baseUrl={baseUrl}
            locale={locale}
          />
          {byproducts.length > 0 && (
            <div className="calc-material-group">
              <div className="calc-material-group-title">{t('materialSummaryByproducts')}</div>
              <MaterialGrid
                materials={byproducts}
                langLabels={langLabels}
                bundleId={bundleId}
                baseUrl={baseUrl}
                locale={locale}
              />
            </div>
          )}
        </>
      ) : (
        targetGroups &&
        Array.from(targetGroups.values()).map((summary) => (
          <TargetGroup
            key={summary.targetItemId}
            summary={summary}
            langLabels={langLabels}
            bundleId={bundleId}
            baseUrl={baseUrl}
            locale={locale}
          />
        ))
      )}


    </div>
  )
}
