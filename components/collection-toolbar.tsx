import { ViewToggle, type ViewMode } from "@/components/view-toggle";

export const TOOLBAR_SELECT = "h-9 w-full sm:w-[170px]";

type Props = {
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
