"use client";

import { WandSparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useApplyRule } from "@/features/rules/api/use-apply-rule";
import { useDeleteRule } from "@/features/rules/api/use-delete-rule";
import { useGetRules } from "@/features/rules/api/use-get-rules";
import {
  RuleRow,
  type RuleRowData,
} from "@/features/rules/components/rule-row";
import { useNewRule } from "@/features/rules/hooks/use-new-rule";
import { useOpenRule } from "@/features/rules/hooks/use-open-rule";
import { useConfirm } from "@/hooks/use-confirm";
import { PAGE_META } from "@/lib/routes";
import { pluralize } from "@/lib/utils";

const RulesPage = () => {
  const rulesQuery = useGetRules();
  const applyRule = useApplyRule();
  const newRule = useNewRule();
  const openRule = useOpenRule();
  const deleteRule = useDeleteRule();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this rule?",
    "Transactions it already categorised keep their category.",
    { confirmLabel: "Delete rule" }
  );

  const rules = rulesQuery.data ?? [];
  const isBusy = applyRule.isPending || deleteRule.isPending;

  const onDelete = async (rule: RuleRowData) => {
    if (await confirm()) deleteRule.mutate(rule.id);
  };

  const renderBody = () => {
    if (rulesQuery.isLoading) return <TablePageSkeleton />;

    if (rulesQuery.isError) {
      return <ErrorState onRetry={() => rulesQuery.refetch()} />;
    }

    if (rules.length === 0) {
      return (
        <EmptyState
          icon={WandSparkles}
          title="No rules yet"
          description="Tell Fintrack which category a payee belongs to once, and every new or imported transaction from them is filed for you."
          actionLabel="Add rule"
          onAction={newRule.onOpen}
        />
      );
    }

    return (
      <ul className="divide-border divide-y">
        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            disabled={isBusy}
            onEdit={openRule.onOpen}
            onApply={(id) => applyRule.mutate(id)}
            onDelete={onDelete}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <PageHeader
        title={PAGE_META["/rules"].title}
        description={PAGE_META["/rules"].description}
        chips={
          rules.length > 0
            ? [{ label: pluralize(rules.length, "rule"), icon: WandSparkles }]
            : undefined
        }
      />
      <Card>
        <CardContent className="pt-5">{renderBody()}</CardContent>
      </Card>
    </div>
  );
};

export default RulesPage;
