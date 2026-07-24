import type { CalculatorState, CalculatorTarget } from '../../features/recipe-calculator/model/types';

function encodeUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUrlSafe(encoded: string): string {
  let result = encoded;
  const pad = result.length % 4;
  if (pad) {
    result += '='.repeat(4 - pad);
  }
  return result.replace(/-/g, '+').replace(/_/g, '/');
}

export function encodeCalcState(state: CalculatorState): string {
  return encodeUrlSafe(btoa(JSON.stringify(state)));
}

export function decodeCalcState(encoded: string): CalculatorState | null {
  if (!encoded || !encoded.trim()) {
    return null;
  }
  try {
    const json = atob(decodeUrlSafe(encoded.trim()));
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;

      if (Array.isArray(obj.targets)) {
        const targets: CalculatorTarget[] = obj.targets
          .filter((t: unknown) =>
            t && typeof t === 'object' &&
            typeof (t as CalculatorTarget).itemId === 'string' &&
            typeof (t as CalculatorTarget).amount === 'number'
          )
          .map((t: unknown) => ({
            itemId: String((t as CalculatorTarget).itemId),
            amount: Number((t as CalculatorTarget).amount) || 1,
          }));

        if (targets.length > 0) {
          return {
            targets,
            selections: obj.selections && typeof obj.selections === 'object'
              ? obj.selections as Record<string, string>
              : {},
          };
        }
      }

      if (typeof obj.item === 'string' && obj.item) {
        return {
          targets: [{ itemId: String(obj.item), amount: Number(obj.amount) || 1 }],
          selections: obj.selections && typeof obj.selections === 'object'
            ? obj.selections as Record<string, string>
            : {},
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
