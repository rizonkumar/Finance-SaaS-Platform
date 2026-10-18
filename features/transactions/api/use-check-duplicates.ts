import { useMutation } from "@tanstack/react-query";
import { type InferRequestType, type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";

type Endpoint = typeof client.api.transactions.duplicates.$post;
type ResponseType = InferResponseType<Endpoint, 200>;
type RequestType = InferRequestType<Endpoint>["json"];

export const useCheckDuplicates = () =>
  useMutation<number[], Error, RequestType>({
    mutationFn: async (json) => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.transactions.duplicates.$post({ json }),
        "Could not check for duplicates"
      );

      return data;
    },
  });
