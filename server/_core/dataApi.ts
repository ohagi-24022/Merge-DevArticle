/**
 * Optional third-party API integrations.
 * Implement per-API fetch logic here when needed.
 */
export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error(
    "callDataApi is not configured. Add your API client in server/_core/dataApi.ts.",
  );
}
