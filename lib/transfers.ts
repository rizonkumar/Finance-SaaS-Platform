export type TransferParty = {
  id: string;
  name: string;
};

export type TransferInput = {
  amount: number;
  date: Date;
  notes: string | null;
  source: TransferParty;
  destination: TransferParty;
};

export type TransferLeg = {
  accountId: string;
  amount: number;
  payee: string;
  notes: string | null;
  date: Date;
};

export const transferPayee = (direction: "out" | "in", counterparty: string) =>
  direction === "out"
    ? `Transfer to ${counterparty}`
    : `Transfer from ${counterparty}`;

export function buildTransferLegs(
  input: TransferInput
): [TransferLeg, TransferLeg] {
  const magnitude = Math.abs(input.amount);
  const shared = { date: input.date, notes: input.notes };

  return [
    {
      ...shared,
      accountId: input.source.id,
      amount: -magnitude,
      payee: transferPayee("out", input.destination.name),
    },
    {
      ...shared,
      accountId: input.destination.id,
      amount: magnitude,
      payee: transferPayee("in", input.source.name),
    },
  ];
}

export function readTransferLegs<T extends { amount: number }>(
  rows: T[]
): { source: T; destination: T } | null {
  if (rows.length !== 2) return null;

  const source = rows.find((row) => row.amount < 0);
  const destination = rows.find((row) => row.amount > 0);

  if (!source || !destination) return null;

  return { source, destination };
}
