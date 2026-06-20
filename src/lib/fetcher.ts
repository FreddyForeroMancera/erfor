export const fetcher = async <T>(url: string): Promise<T> => {
  const headers: HeadersInit = {};
  if (process.env.NEXT_PUBLIC_API_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as any).info = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
};
