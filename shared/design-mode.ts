export type ResolvedDesignElement = {
  element: Element;
};

export type GetStyleInfo = (
  resolved: ResolvedDesignElement,
) => {
  className: string;
  styles: Record<string, string> | null;
};

export function initDesignMode(_: GetStyleInfo): () => void {
  // This workspace does not ship the full shared design-mode tooling.
  // Return a no-op reselect handler so the UI can run normally in dev.
  return () => {};
}
