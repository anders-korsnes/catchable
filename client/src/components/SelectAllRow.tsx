interface Props {
  /** Count of currently selected items. */
  selected: number;
  /** Total number of items the user could select. */
  total: number;
  /** Called with the new full set when the toggle is clicked. */
  onToggle: (allSelected: boolean) => void;
  /** Singular noun rendered next to the count, e.g. "regions". */
  noun: string;
}

/**
 * Compact "X of Y selected" header with a single button that flips to
 * "Select all" or "Clear" depending on current state. Designed to sit just
 * above a list of checkbox-style options.
 */
export function SelectAllRow({ selected, total, onToggle, noun }: Props) {
  const allSelected = selected >= total && total > 0;
  return (
    <div className="mb-2 flex items-center justify-between text-xs">
      <span className="text-ink-muted">
        <span className="font-semibold text-ink">{selected}</span> of {total} {noun} selected
      </span>
      <button
        type="button"
        onClick={() => onToggle(!allSelected)}
        disabled={total === 0}
        className="focus-ring rounded-full border border-line px-3 py-1 font-medium text-ink hover:bg-bg disabled:opacity-50"
      >
        {allSelected ? 'Clear' : 'Select all'}
      </button>
    </div>
  );
}
