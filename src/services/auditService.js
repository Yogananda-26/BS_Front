import client from "../api/client";

// Try every plausible shape the backend might return and pull out an array.
const extractArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.content)) return raw.content;
  if (Array.isArray(raw.data?.content)) return raw.data.content;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  return [];
};

const normalizePage = (raw) => {
  if (raw && typeof raw === "object" && "content" in raw) return raw;
  if (raw?.data && typeof raw.data === "object" && "content" in raw.data) return raw.data;
  const arr = extractArray(raw);
  return {
    content: arr,
    totalElements: arr.length,
    totalPages: 1,
    page: 0,
    size: arr.length
  };
};

const paginate = (all, page, size) => {
  const sorted = [...all].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  const start = page * size;
  return {
    content: sorted.slice(start, start + size),
    totalElements: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / size)),
    page,
    size
  };
};

const fetchAllForUserViaFullList = async (userId) => {
  // Fallback path: grab a large page from the regular list endpoint and
  // filter on the client. Used when the per-user endpoint isn't reachable
  // or returns an unexpected shape.
  const res = await client.get(
    `/admin/audit-logs?page=0&size=1000&sortBy=timestamp&sortDir=desc`
  );
  const all = extractArray(res.data);
  const needle = userId.toLowerCase();
  return all.filter((log) => log?.userId?.toLowerCase().includes(needle));
};

const auditService = {
  getLogs: async (page = 0, size = 15, userId = "") => {
    const trimmedUserId = (userId || "").trim();

    if (trimmedUserId) {
      // Primary path: dedicated by-user endpoint.
      try {
        const url = `/admin/audit/logs/user/${encodeURIComponent(trimmedUserId)}`;
        const res = await client.get(url);
        // eslint-disable-next-line no-console
        console.log("[auditService] by-user URL:", url, "status:", res.status, "data:", res.data);
        const all = extractArray(res.data);
        if (all.length > 0) {
          return paginate(all, page, size);
        }
        // Endpoint returned nothing useful — try the fallback.
        // eslint-disable-next-line no-console
        console.warn("[auditService] by-user returned 0 records, falling back to full-list filter");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[auditService] by-user endpoint failed, falling back to full-list filter:", err?.message);
      }

      // Fallback: filter the full list on the client.
      try {
        const all = await fetchAllForUserViaFullList(trimmedUserId);
        // eslint-disable-next-line no-console
        console.log("[auditService] fallback filter matched:", all.length);
        return paginate(all, page, size);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[auditService] fallback also failed:", err);
        return { content: [], totalElements: 0, totalPages: 0, page: 0, size: 0 };
      }
    }

    // No filter: normal paginated list.
    const res = await client.get(
      `/admin/audit-logs?page=${page}&size=${size}&sortBy=timestamp&sortDir=desc`
    );
    return normalizePage(res.data);
  }
};

export {
  auditService
};