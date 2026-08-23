"use client";

import { Suspense, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Filters } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useNewTransfer } from "@/features/transfers/hooks/use-new-transfer";
import type { ImportedTransaction } from "@/lib/csv-import";
import { PAGE_META } from "@/lib/routes";

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
  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

  const newTransfer = useNewTransfer();
  const createTransactions = useBulkCreateTransactions();
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

  const onSubmitImport = async (values: ImportedTransaction[]) => {
    const accountId = await confirm();

    if (!accountId) {
      return toast.error("Select an account to continue");
    }

    const data = values.map((value) => ({
      ...value,
      accountId: accountId as string,
    }));

    createTransactions.mutate(data, {
      onSuccess: onCancelImport,
    });
  };

  if (transactionsQuery.isLoading) {
    return <TablePageSkeleton />;
  }

  if (variant === VARIANTS.IMPORT) {
    return (
      <>
        <AccountDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={onSubmitImport}
        />
      </>
    );
  }

  return (
    <>
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
          </>
        }
      />
      <Card>
        <CardContent className="pt-5">
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
        </CardContent>
      </Card>
    </>
  );
};

export default TransactionsPage;
