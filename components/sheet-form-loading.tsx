import { Loader2 } from "lucide-react";

// Shared placeholder for sheets that fetch before they can render their form.
// Sits in normal flow rather than absolutely positioned: SheetContent is
// `fixed`, not `relative`, so an inset-0 child centred against the viewport.
export const SheetFormLoading = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="size-4 animate-spin text-gray-600" />
  </div>
);
