/**
 * In-memory repository stubs for Hermes OS Client.
 * Eliminates all external PostgreSQL, Supabase, Drizzle, and Redis dependencies.
 * All persistent state belongs inside Hermes OS Gateway.
 */

export const userRepository = {
  selectUserById: async (id: string) => ({
    id: id || "hermes-operator",
    name: "Hermes Operator",
    email: "operator@hermes.local",
    role: "admin",
  }),
  updateUser: async () => ({ success: true }),
  selectUserPreferences: async () => ({}),
  updateUserPreferences: async () => ({}),
  selectUsersList: async () => [],
};

export const chatRepository = {
  selectThreadDetails: async (id: string) => ({
    id,
    title: "Hermes Session",
    userId: "hermes-operator",
    messages: [],
  }),
  insertThread: async (data: any) => ({
    id: data.id || `thread_${Date.now()}`,
    title: data.title || "Hermes Session",
    userId: "hermes-operator",
  }),
  selectThreads: async () => [],
  deleteThread: async () => ({ success: true }),
  selectThreadList: async () => [],
};

export const agentRepository = {
  selectAgents: async () => [],
  selectAgentById: async () => null,
  insertAgent: async () => ({}),
  updateAgent: async () => ({}),
  deleteAgent: async () => ({}),
};

export const mcpRepository = {
  selectMcpServers: async () => [],
  selectMcpServerById: async () => null,
  insertMcpServer: async () => ({}),
  updateMcpServer: async () => ({}),
  deleteMcpServer: async () => ({}),
};

export const mcpMcpToolCustomizationRepository = {
  findCustomization: async () => null,
  upsertCustomization: async () => ({}),
};

export const mcpServerCustomizationRepository = {
  findCustomization: async () => null,
  upsertCustomization: async () => ({}),
};

export const mcpOAuthRepository = {
  findToken: async () => null,
  saveToken: async () => ({}),
};

export const workflowRepository = {
  selectWorkflows: async () => [],
  selectWorkflowById: async () => null,
  insertWorkflow: async () => ({}),
  updateWorkflow: async () => ({}),
  deleteWorkflow: async () => ({}),
};

export const archiveRepository = {
  selectArchives: async () => [],
  selectArchiveById: async () => null,
  insertArchive: async () => ({}),
  deleteArchive: async () => ({}),
};

export const bookmarkRepository = {
  selectBookmarks: async () => [],
  insertBookmark: async () => ({}),
  deleteBookmark: async () => ({}),
};

export const chatExportRepository = {
  selectExports: async () => [],
  insertExport: async () => ({}),
};
