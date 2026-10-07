export const STATUS_LABELS = ["FUNDED", "ACCEPTED", "SUBMITTED", "REVISION_NEEDED", "RETRYABLE", "AWARDED", "WITHDRAWN", "EXPIRED_REFUNDED"] as const;
export const shortAddress = (value?: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "Not connected";
export const shortHash = (value?: string) => value ? `${value.slice(0, 10)}…${value.slice(-8)}` : "—";
export const formatDate = (value: bigint | number) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(Number(value) * 1000));
export const formatGen = (value: bigint) => {
  const whole = value / 10n ** 18n;
  const fraction = (value % 10n ** 18n).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} GEN`;
};
export const parseGen = (value: string) => {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error("Enter a valid GEN amount with at most 18 decimals.");
  const [whole, decimal = ""] = value.split(".");
  const result = BigInt(whole) * 10n ** 18n + BigInt(decimal.padEnd(18, "0"));
  if (result <= 0n) throw new Error("Award must be greater than zero.");
  return result;
};
