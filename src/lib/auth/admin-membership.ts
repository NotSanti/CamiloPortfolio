/** Pure membership check — safe to import from proxy.ts (no cookies()). */
export function isListedAdmin(
  row: { user_id: string } | null,
  userId: string,
): boolean {
  return row?.user_id === userId;
}
