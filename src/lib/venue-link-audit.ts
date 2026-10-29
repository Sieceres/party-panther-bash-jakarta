export interface VenueLinkedItem {
  id: string;
  title: string;
  venue_id: string | null;
  venue_name: string | null;
  slug: string | null;
}

export function findUnlinkedVenueItems<T extends VenueLinkedItem>(items: T[], venueIds: ReadonlySet<string>): T[] {
  return items.filter(item => !item.venue_id || !venueIds.has(item.venue_id));
}

export async function fetchAllAuditRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}