import { ViewToggle, type ViewMode } from "@/components/view-toggle";

// One control width for every filter/sort trigger in a collection toolbar, so
// adjacent selects line up instead of each picking its own magic number.
export const TOOLBAR_SELECT = "h-9 w-full sm:w-[170px]";

type Props = {
  /** Search input plus any filter/sort selects. */
  children: React.ReactNode;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
};

export const CollectionToolbar = ({
  children,
  viewMode,
  onViewModeChange,
}: Props) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
    <div className="flex shrink-0 items-center gap-2">
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </div>
  </div>
);
