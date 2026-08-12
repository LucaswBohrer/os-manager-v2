import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, json, index, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes (Pessoa Física ou Jurídica)
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 32 }), // CPF ou CNPJ
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Equipamentos vinculados aos Clientes
 */
export const equipments = mysqlTable("equipments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  type: varchar("type", { length: 128 }).notNull(), // Ex: Notebook, Smartphone, Impressora
  brand: varchar("brand", { length: 128 }),
  model: varchar("model", { length: 128 }),
  serialNumber: varchar("serialNumber", { length: 128 }),
  specs: text("specs"), // Especificações técnicas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("equipments_client_idx").on(table.clientId),
  clientFk: foreignKey({ columns: [table.clientId], foreignColumns: [clients.id] }),
}));

export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = typeof equipments.$inferInsert;

/**
 * Estoque de Peças e Componentes
 */
export const parts = mysqlTable("parts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 64 }).unique(),
  stockQty: int("stockQty").default(0).notNull(),
  minStockQty: int("minStockQty").default(2).notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  sellPrice: decimal("sellPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Part = typeof parts.$inferSelect;
export type InsertPart = typeof parts.$inferInsert;

/**
 * Ordens de Serviço (OS) — O núcleo do sistema
 */
export const serviceOrders = mysqlTable("serviceOrders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  equipmentId: int("equipmentId").notNull(),
  status: mysqlEnum("status", [
    "opened",
    "diagnosing",
    "budget",
    "in_progress",
    "waiting_parts",
    "completed",
    "delivered",
    "cancelled"
  ]).default("opened").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  defectReported: text("defectReported").notNull(),
  diagnosis: text("diagnosis"),
  checklist: json("checklist"), // JSON para itens de inspeção de entrada
  laborCost: decimal("laborCost", { precision: 10, scale: 2 }).default("0.00").notNull(),
  partsCost: decimal("partsCost", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  warrantyDays: int("warrantyDays").default(90).notNull(),
  originalOsId: int("originalOsId"), // Para controle de garantia/retorno
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("service_orders_client_idx").on(table.clientId),
  equipmentIdx: index("service_orders_equipment_idx").on(table.equipmentId),
  statusIdx: index("service_orders_status_idx").on(table.status),
  clientFk: foreignKey({ columns: [table.clientId], foreignColumns: [clients.id] }),
  equipmentFk: foreignKey({ columns: [table.equipmentId], foreignColumns: [equipments.id] }),
  originalOrderFk: foreignKey({ columns: [table.originalOsId], foreignColumns: [table.id] }),
}));

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = typeof serviceOrders.$inferInsert;

/**
 * Peças utilizadas em cada OS (Estoque Integrado)
 */
export const osParts = mysqlTable("osParts", {
  id: int("id").autoincrement().primaryKey(),
  serviceOrderId: int("serviceOrderId").notNull(),
  partId: int("partId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  serviceOrderIdx: index("os_parts_service_order_idx").on(table.serviceOrderId),
  partIdx: index("os_parts_part_idx").on(table.partId),
  serviceOrderFk: foreignKey({ columns: [table.serviceOrderId], foreignColumns: [serviceOrders.id] }),
  partFk: foreignKey({ columns: [table.partId], foreignColumns: [parts.id] }),
}));

export type OsPart = typeof osParts.$inferSelect;
export type InsertOsPart = typeof osParts.$inferInsert;

/**
 * Timeline / Histórico de alterações da OS
 */
export const osHistory = mysqlTable("osHistory", {
  id: int("id").autoincrement().primaryKey(),
  serviceOrderId: int("serviceOrderId").notNull(),
  author: varchar("author", { length: 128 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  serviceOrderIdx: index("os_history_service_order_idx").on(table.serviceOrderId),
  serviceOrderFk: foreignKey({ columns: [table.serviceOrderId], foreignColumns: [serviceOrders.id] }),
}));

export type OsHistory = typeof osHistory.$inferSelect;
export type InsertOsHistory = typeof osHistory.$inferInsert;

/**
 * Orçamentos detalhados vinculados às Ordens de Serviço
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().notNull(),
  serviceOrderId: int("serviceOrderId").notNull(),
  subtotalParts: decimal("subtotalParts", { precision: 10, scale: 2 }).default("0.00").notNull(),
  subtotalLabor: decimal("subtotalLabor", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  additionalFee: decimal("additionalFee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  validUntil: timestamp("validUntil"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceOrderIdx: index("budgets_service_order_idx").on(table.serviceOrderId),
  serviceOrderFk: foreignKey({ columns: [table.serviceOrderId], foreignColumns: [serviceOrders.id] }),
}));

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Controle de Garantias e Retornos
 */
export const warranties = mysqlTable("warranties", {
  id: int("id").autoincrement().notNull(),
  serviceOrderId: int("serviceOrderId").notNull(),
  returnOsId: int("returnOsId"), // Caso retorne em garantia gerando nova OS
  warrantyDays: int("warrantyDays").default(90).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  terms: text("terms"),
  status: mysqlEnum("status", ["active", "expired", "claimed", "void"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceOrderIdx: index("warranties_service_order_idx").on(table.serviceOrderId),
  serviceOrderFk: foreignKey({ columns: [table.serviceOrderId], foreignColumns: [serviceOrders.id] }),
  returnOrderFk: foreignKey({ columns: [table.returnOsId], foreignColumns: [serviceOrders.id] }),
}));

export type Warranty = typeof warranties.$inferSelect;
export type InsertWarranty = typeof warranties.$inferInsert;

/**
 * Auditoria Geral do Sistema
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().notNull(),
  author: varchar("author", { length: 128 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entity: varchar("entity", { length: 64 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("audit_logs_entity_idx").on(table.entity, table.entityId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
