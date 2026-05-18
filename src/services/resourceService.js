import client from "../api/client";
const resourceService = {
  // Resources
  getResources: async () => {
    const res = await client.get("/api/resources");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getResourcesPaginated: async (page = 0, size = 10, type, availability) => {
    const res = await client.get(`/api/resources/page?page=${page}&size=${size}&type=${type || ""}&availability=${availability || ""}`);
    return res.data?.data || res.data;
  },
  getResourceById: async (id) => {
    const res = await client.get(`/api/resources/${id}`);
    return res.data?.data || res.data;
  },
  addResource: async (payload) => {
    const res = await client.post("/api/resources", payload);
    return res.data?.data || res.data;
  },
  updateResource: async (id, payload) => {
    await client.put(`/api/resources/${id}`, payload);
  },
  deleteResource: async (id) => {
    await client.delete(`/api/resources/${id}`);
  },
  getResourcesByType: async (type) => {
    const res = await client.get(`/api/resources/type/${type}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getAvailableResources: async () => {
    const res = await client.get("/api/resources/available");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // Allocations
  getAllocations: async () => {
    const res = await client.get("/api/allocations");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getAllocationById: async (id) => {
    const res = await client.get(`/api/allocations/${id}`);
    return res.data?.data || res.data;
  },
  getAllocationsPaginated: async (page = 0, size = 10) => {
    const res = await client.get(`/api/allocations/page?page=${page}&size=${size}`);
    return res.data?.data || res.data;
  },
  getAllocationEvent: async (id) => {
    const res = await client.get(`/api/allocations/${id}/event`);
    return res.data?.data || res.data;
  },
  getAllocationCost: async (id) => {
    const res = await client.get(`/api/allocations/${id}/cost`);
    return res.data?.data || res.data;
  },
  createAllocation: async (payload) => {
    const res = await client.post("/api/allocations", payload);
    return res.data?.data || res.data;
  },
  getAllocationsByProject: async (projectId) => {
    const res = await client.get(`/api/allocations/project/${projectId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getAllocationsByResource: async (resourceId) => {
    const res = await client.get(`/api/allocations/resource/${resourceId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  updateAllocation: async (id, payload) => {
    await client.put(`/api/allocations/${id}`, payload);
  },
  deleteAllocation: async (id) => {
    await client.delete(`/api/allocations/${id}`);
  },
  internalResourceCallback: async (resourceId, payload) => {
    await client.post(`/api/internal/resources/${resourceId}/budget-result`, payload);
  }
};
export {
  resourceService
};
