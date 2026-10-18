import { convertAmountToMiliunits } from "@/lib/utils";

export const MIN_SPLITS = 2;
export const MAX_SPLITS = 20;

export type SplitLine = {
  categoryId: string | null;
  amount: number;
};

export const SPLIT_ERRORS = {
  tooFew: "Split it across at least two categories",
  zeroAmount: "Give every split an amount",
  mixedSigns: "Every split must move money the same way as the transaction",
  mismatch: "The splits must add up to the transaction amount",
} as const;

export const splitTotal = (lines: Pick<SplitLine, "amount">[]) =>
  lines.reduce((total, line) => total + line.amount, 0);

export const splitRemainder = (
  total: number,
  lines: Pick<SplitLine, "amount">[]
) => total - splitTotal(lines);

export function splitError(
  total: number,
  lines: Pick<SplitLine, "amount">[]
): string | null {
  if (lines.length < MIN_SPLITS) return SPLIT_ERRORS.tooFew;
  if (lines.some((line) => line.amount === 0)) return SPLIT_ERRORS.zeroAmount;
  if (lines.some((line) => Math.sign(line.amount) !== Math.sign(total))) {
    return SPLIT_ERRORS.mixedSigns;
  }
  if (splitRemainder(total, lines) !== 0) return SPLIT_ERRORS.mismatch;

  return null;
}

export type SplitDraft = {
  categoryId?: string | null;
  amount: string;
};

export const toSplitLines = (total: number, drafts: SplitDraft[]) =>
  drafts.map((draft) => ({
    categoryId: draft.categoryId ?? null,
    amount:
      Math.sign(total) *
      convertAmountToMiliunits(Math.abs(Number.parseFloat(draft.amount) || 0)),
  }));
