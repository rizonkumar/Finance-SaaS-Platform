"use client";

import { NavGroup, NavItem } from "@/components/nav-item";
import {
  useGetViews,
  type SavedView,
} from "@/features/views/api/use-get-views";
import { useRecordViewOpen } from "@/features/views/api/use-record-view-open";
import { ViewEmoji } from "@/features/views/components/view-emoji";
import { sidebarViews, viewHref } from "@/lib/saved-views";

type Props = {
  isCollapsed: boolean;
  onNavigate?: () => void;
};

export const SavedViewNav = ({ isCollapsed, onNavigate }: Props) => {
  const viewsQuery = useGetViews();
  const recordOpen = useRecordViewOpen();

  const { pinned, recent } = sidebarViews(viewsQuery.data ?? []);

  const renderGroup = (label: string, views: SavedView[]) =>
    views.length > 0 && (
      <NavGroup label={label} isCollapsed={isCollapsed}>
        {views.map((view) => (
          <NavItem
            key={view.id}
            href={viewHref(view)}
            label={view.name}
            icon={<ViewEmoji emoji={view.emoji} />}
            isCollapsed={isCollapsed}
            onClick={() => {
              recordOpen(view.id);
              onNavigate?.();
            }}
          />
        ))}
      </NavGroup>
    );

  return (
    <>
      {renderGroup("Pinned", pinned)}
      {renderGroup("Recent", recent)}
    </>
  );
};
