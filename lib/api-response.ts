type JsonResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

export async function parseResponse<T>(
  response: JsonResponse,
  fallback: string
): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? fallback);
  }

  return body as T;
}
