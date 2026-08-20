export type LoadState<T> =
  | { status: "error" }
  | { status: "success"; data: T };

export function loadStateFromQuery<T>(
  error: unknown,
  data: T,
): LoadState<T> {
  if (error) return { status: "error" };
  return { status: "success", data };
}
