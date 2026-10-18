"use client";

import { TriangleAlert } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { SheetFormLoading } from "@/components/sheet-form-loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeleteData } from "@/features/settings/api/use-delete-data";
import { useEditSettings } from "@/features/settings/api/use-edit-settings";
import { useGetSettings } from "@/features/settings/api/use-get-settings";
import { PreferencesForm } from "@/features/settings/components/preferences-form";
import { useConfirm } from "@/hooks/use-confirm";
import { PAGE_META } from "@/lib/routes";

const SettingsPage = () => {
  const settingsQuery = useGetSettings();
  const editSettings = useEditSettings();
  const deleteData = useDeleteData();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete all of your data?",
    "Every account, transaction, budget, goal, debt, rule and saved view is removed for good. This cannot be undone.",
    { confirmLabel: "Delete everything" }
  );

  const onDeleteData = async () => {
    if (await confirm()) deleteData.mutate();
  };

  const renderPreferences = () => {
    if (settingsQuery.isLoading) return <SheetFormLoading />;

    if (settingsQuery.isError || !settingsQuery.data) {
      return <ErrorState onRetry={() => settingsQuery.refetch()} />;
    }

    return (
      <PreferencesForm
        defaultValues={settingsQuery.data}
        onSubmit={(values) => editSettings.mutate(values)}
        isSubmitting={editSettings.isPending}
      />
    );
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <PageHeader
        title={PAGE_META["/settings"].title}
        description={PAGE_META["/settings"].description}
      />
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            How money and dates are shown across Fintrack.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderPreferences()}</CardContent>
      </Card>
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-x-2 text-red-900">
            <TriangleAlert className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Start again from an empty workspace. Your sign-in stays, everything
            else goes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={onDeleteData}
            isLoading={deleteData.isPending}
          >
            Delete all data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
