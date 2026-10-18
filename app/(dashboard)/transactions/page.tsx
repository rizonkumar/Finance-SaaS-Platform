"use client";

import { Suspense, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ExportButton } from "@/components/export-button";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Filters } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useCheckDuplicates } from "@/features/transactions/api/use-check-duplicates";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useDuplicateReview } from "@/features/transactions/hooks/use-duplicate-review";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useNewTransfer } from "@/features/transfers/hooks/use-new-transfer";
import type { ImportedTransaction } from "@/lib/csv-import";
import { withoutIndexes } from "@/lib/duplicates";
import { PAGE_META } from "@/lib/routes";
import { transactionsCsvTable } from "@/lib/transaction-export";

import { columns } from "./columns";
import { ImportCard } from "./import-card";
import { UploadButton, type CSVUploadResult } from "./upload-button";

enum VARIANTS {
  LIST = "LIST",
  IMPORT = "IMPORT",
}

const INITIAL_IMPORT_RESULTS: CSVUploadResult = {
  data: [],
  errors: [],
  meta: {},
};

const TransactionsPage = () => {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <TransactionsPageContent />
    </Suspense>
  );
};

const TransactionsPageContent = () => {
  const [AccountDialog, confirm] = useSelectAccount();
  const [DuplicateReviewDialog, reviewDuplicates] = useDuplicateReview();
  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

  const newTransaction = useNewTransaction();
  const newTransfer = useNewTransfer();
  const createTransactions = useBulkCreateTransactions();
  const checkDuplicates = useCheckDuplicates();
  const deleteTransactions = useBulkDeleteTransactions();
  const transactionsQuery = useGetTransactions();
  const transactions = transactionsQuery.data || [];

  const isDisabled =
    transactionsQuery.isLoading || deleteTransactions.isPending;

  const onUpload = (results: CSVUploadResult) => {
    setImportResults(results);
    setVariant(VARIANTS.IMPORT);
  };

  const onCancelImport = () => {
    setImportResults(INITIAL_IMPORT_RESULTS);
    setVariant(VARIANTS.LIST);
  };

  const resolveDuplicates = async (
    accountId: string,
    values: ImportedTransaction[]
  ) => {
    const indexes = await checkDuplicates.mutateAsync({
      accountId,
      rows: values.map(({ date, amount, payee }) => ({ date, amount, payee })),
    });

    if (indexes.length === 0) return values;

    const decision = await reviewDuplicates(
      indexes.flatMap((index) => values[index] ?? [])
    );

    if (decision === "cancel") return null;

    return decision === "skip" ? withoutIndexes(values, indexes) : values;
  };

  const onSubmitImport = async (values: ImportedTransaction[]) => {
    const accountId = await confirm();

    if (!accountId) {
      return toast.error("Select an account to continue");
    }

    try {
      const rows = await resolveDuplicates(accountId as string, values);

      if (!rows) return;

      if (rows.length === 0) {
        toast.info("Everything in this file is already imported");
        return onCancelImport();
      }

      createTransactions.mutate(
        rows.map((row) => ({ ...row, accountId: accountId as string })),
        { onSuccess: onCancelImport }
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (variant === VARIANTS.IMPORT) {
    return (
      <>
        <AccountDialog />
        <DuplicateReviewDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={onSubmitImport}
        />
      </>
    );
  }

  const renderBody = () => {
    if (transactionsQuery.isLoading) return <TablePageSkeleton />;

    if (transactionsQuery.isError) {
      return <ErrorState onRetry={() => transactionsQuery.refetch()} />;
    }

    if (transactions.length === 0) {
      return (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add a transaction by hand, record a transfer, or import a CSV from your bank."
          actionLabel="Add transaction"
          onAction={() => newTransaction.onOpen()}
        />
      );
    }

    return (
      <DataTable
        filterKey="payee"
        columns={columns}
        data={transactions}
        onDelete={(row) => {
          const ids = row.map((r) => r.original.id);
          deleteTransactions.mutate({ ids });
        }}
        disabled={isDisabled}
      />
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/transactions"].title}
        description={PAGE_META["/transactions"].description}
        chips={
          transactions.length > 0
            ? [
                {
                  label: `${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"}`,
                  icon: ArrowLeftRight,
                },
              ]
            : undefined
        }
        filters={<Filters />}
        actions={
          <>
            <Button onClick={newTransfer.onOpen} size="sm" variant="outline">
              <ArrowLeftRight className="size-4" />
              Transfer
            </Button>
            <UploadButton onUpload={onUpload} />
            <ExportButton
              name="transactions"
              disabled={transactions.length === 0}
              getTable={() => transactionsCsvTable(transactions)}
            />
          </>
        }
      />
      <Card>
        <CardContent className="pt-5">{renderBody()}</CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
