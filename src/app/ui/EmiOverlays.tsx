/**
 * Global EMI overlay hosts (must match TFG-Recipe-Viewer/site/index.html).
 * emi-recipe-renderer fills .tag-popover-header / -stage-wrap / -footer on tag slot click.
 */
export function EmiOverlays() {
  return (
    <>
      <div id="tooltip" />
      <div id="tag-popover" className="tag-popover" hidden>
        <div className="tag-popover-panel" role="dialog" aria-modal="true">
          <div className="tag-popover-header" />
          <div className="tag-popover-stage-wrap" />
          <div className="tag-popover-footer" />
        </div>
      </div>
    </>
  );
}
