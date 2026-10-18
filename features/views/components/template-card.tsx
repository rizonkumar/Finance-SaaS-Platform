import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type ViewTemplate } from "@/lib/saved-views";

type Props = {
  template: ViewTemplate;
  isAdded: boolean;
  disabled?: boolean;
  onAdd: (template: ViewTemplate) => void;
};

export const TemplateCard = ({ template, isAdded, disabled, onAdd }: Props) => (
  <Card className="flex flex-col gap-y-4 p-4">
    <div className="flex items-start gap-x-3">
      <div className="bg-alpha-100 flex size-9 shrink-0 items-center justify-center rounded-sm text-base">
        <span aria-hidden>{template.emoji}</span>
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="copy-14 text-gray-1000 font-medium">{template.name}</p>
        <p className="copy-13 text-gray-900">{template.description}</p>
      </div>
    </div>
    <Button
      size="sm"
      variant="outline"
      className="mt-auto self-start"
      disabled={disabled || isAdded}
      onClick={() => onAdd(template)}
    >
      {isAdded ? <Check /> : <Plus />}
      {isAdded ? "Added" : "Add view"}
    </Button>
  </Card>
);
