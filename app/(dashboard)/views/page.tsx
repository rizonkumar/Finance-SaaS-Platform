"use client";

import { useState } from "react";
import { Bookmark, Pin } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatGroup } from "@/components/stat-group";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateView } from "@/features/views/api/use-create-view";
import { useDeleteView } from "@/features/views/api/use-delete-view";
import { useEditView } from "@/features/views/api/use-edit-view";
import {
  useGetViews,
  type SavedView,
} from "@/features/views/api/use-get-views";
import { useRecordViewOpen } from "@/features/views/api/use-record-view-open";
import { TemplateCard } from "@/features/views/components/template-card";
import { ViewCard } from "@/features/views/components/view-card";
import { useViewDialog } from "@/features/views/hooks/use-view-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { PAGE_META } from "@/lib/routes";
import { VIEW_TEMPLATES, type ViewTemplate } from "@/lib/saved-views";
import { pluralize } from "@/lib/utils";

const SavedViewsPage = () => {
  const viewsQuery = useGetViews();
  const createView = useCreateView();
  const editView = useEditView();
  const deleteView = useDeleteView();
  const recordOpen = useRecordViewOpen();
  const viewDialog = useViewDialog();
  const [pendingDelete, setPendingDelete] = useState<SavedView | null>(null);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this view?",
    `"${pendingDelete?.name ?? ""}" will be removed from your saved views.`
  );

  const views = viewsQuery.data ?? [];
  const pinnedCount = views.filter((view) => view.isPinned).length;
  const isBusy = editView.isPending || deleteView.isPending;

  const isTemplateAdded = (template: ViewTemplate) =>
    views.some(
      (view) =>
        view.route === template.route &&
        view.query === template.query &&
        view.name === template.name
    );

  const onAddTemplate = (template: ViewTemplate) =>
    createView.mutate({
      name: template.name,
      emoji: template.emoji,
      route: template.route,
      query: template.query,
      isPinned: false,
    });

  const onEdit = (view: SavedView) =>
    viewDialog.onOpen({
      id: view.id,
      name: view.name,
      emoji: view.emoji,
      isPinned: view.isPinned,
      route: view.route,
      query: view.query,
    });

  const onDelete = async (view: SavedView) => {
    setPendingDelete(view);
    const ok = await confirm();
    setPendingDelete(null);

    if (ok) deleteView.mutate(view.id);
  };

  const renderSaved = () => {
    if (viewsQuery.isLoading) return <CardGridSkeleton count={3} />;

    if (viewsQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => viewsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    if (views.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Bookmark}
              title="No saved views yet"
              description="Use the bookmark in the top bar on any page to save it with its filters, or start from a template below."
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <StatGroup columns={3}>
        {views.map((view) => (
          <ViewCard
            key={view.id}
            view={view}
            disabled={isBusy}
            onOpen={recordOpen}
            onTogglePin={(item) =>
              editView.mutate({ id: item.id, isPinned: !item.isPinned })
            }
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </StatGroup>
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      <PageHeader
        title={PAGE_META["/views"].title}
        description={PAGE_META["/views"].description}
        chips={
          views.length > 0
            ? [
                { label: pluralize(views.length, "view"), icon: Bookmark },
                { label: `${pinnedCount} pinned`, icon: Pin },
              ]
            : undefined
        }
      />
      {renderSaved()}
      <StatGroup caption="Templates" columns={3}>
        {VIEW_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            isAdded={isTemplateAdded(template)}
            disabled={createView.isPending}
            onAdd={onAddTemplate}
          />
        ))}
      </StatGroup>
    </div>
  );
};

export default SavedViewsPage;
