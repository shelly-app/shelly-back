/**
 * Normalizes a Postgres timestamp/ISO string into a `YYYY-MM-DD` date string,
 * matching the `z.iso.date()` contract used by the pet response schemas.
 * Returns `null` when there is no usable date.
 */
export const toDateOnly = (value: string | null | undefined): string | null => {
  return value ? value.slice(0, 10) : null;
};
