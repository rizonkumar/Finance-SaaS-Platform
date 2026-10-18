import { type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { MONEY_DEPENDENT_KEYS } from "@/lib/query-keys";
import { pluralize } from "@/lib/utils";

type ResponseType = InferResponseType<
  (typeof client.api.rules)[":id"]["apply"]["$post"],
  200
>;

const APPLY_ERROR = "Could not apply the rule";

const appliedMessage = ({ data }: ResponseType) =>
  data.count === 0
    ? "No uncategorized transactions matched"
    : `Categorized ${pluralize(data.count, "transaction")}`;

export const useApplyRule = () =>
  useApiMutation<ResponseType, string>({
    mutationFn: async (id) =>
      parseResponse(
        await client.api.rules[":id"].apply.$post({ param: { id } }),
        APPLY_ERROR
      ),
    successMessage: appliedMessage,
    errorMessage: APPLY_ERROR,
    invalidateKeys: MONEY_DEPENDENT_KEYS,
  });
