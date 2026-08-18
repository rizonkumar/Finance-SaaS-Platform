import { Upload } from "lucide-react";
import { useCSVReader } from "react-papaparse";

import { Button } from "@/components/ui/button";

export type CSVUploadResult = {
  data: string[][];
  errors: unknown[];
  meta: Record<string, unknown>;
};

type CSVReaderRenderProps = {
  getRootProps: () => Record<string, unknown>;
};

type Props = {
  onUpload: (results: CSVUploadResult) => void;
};

export const UploadButton = ({ onUpload }: Props) => {
  const { CSVReader } = useCSVReader();

  return (
    <CSVReader onUploadAccepted={onUpload}>
      {({ getRootProps }: CSVReaderRenderProps) => (
        <Button
          size="sm"
          variant="outline"
          className="w-full lg:w-auto"
          {...getRootProps()}
        >
          <Upload className="size-4" />
          Import CSV
        </Button>
      )}
    </CSVReader>
  );
};
