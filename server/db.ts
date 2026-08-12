import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  clients, InsertClient,
  equipments, InsertEquipment,
  parts, InsertPart,
  serviceOrders, InsertServiceOrder, ServiceOrder,
  osParts, InsertOsPart,
  osHistory,
  budgets, InsertBudget,
  warranties, InsertWarranty,
  auditLogs, InsertAuditLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * CLIENTS QUERIES
 */
export async function getClients() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result;
}

/**
 * EQUIPMENTS QUERIES
 */
export async function getEquipments(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return await db.select().from(equipments).where(eq(equipments.clientId, clientId)).orderBy(desc(equipments.createdAt));
  }
  return await db.select().from(equipments).orderBy(desc(equipments.createdAt));
}

export async function createEquipment(data: InsertEquipment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(equipments).values(data);
}

/**
 * PARTS QUERIES
 */
export async function getParts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parts).orderBy(desc(parts.createdAt));
}

export async function createPart(data: InsertPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(parts).values(data);
}

/**
 * SERVICE ORDERS QUERIES
 */
export async function getServiceOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
}

export async function getServiceOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateServiceOrderDetails(id: number, diagnosis: string, laborCost: string, partsCost: string, discount: string, totalAmount: string, authorName = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(serviceOrders).set({
    diagnosis,
    laborCost,
    partsCost,
    discount,
    totalAmount,
    updatedAt: new Date(),
  }).where(eq(serviceOrders.id, id));

  await db.insert(osHistory).values({
    serviceOrderId: id,
    author: authorName,
    action: "Atualização de Orçamento/Diagnóstico",
    description: `Diagnóstico e orçamento atualizados. Total: R$ ${totalAmount}`,
  });
}

export async function updatePartStock(partId: number, quantityChange: number, authorName = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(parts).where(eq(parts.id, partId)).limit(1);
  const part = rows[0];
  if (!part) throw new Error("Peça não encontrada");

  const newQty = part.stockQty + quantityChange;
  if (newQty < 0) throw new Error("Estoque insuficiente para esta operação");

  await db.update(parts).set({ stockQty: newQty, updatedAt: new Date() }).where(eq(parts.id, partId));
}

export async function createServiceOrder(data: InsertServiceOrder, authorName = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(serviceOrders).values(data);
  const insertId = Number(result[0].insertId);

  // Registrar histórico inicial
  await db.insert(osHistory).values({
    serviceOrderId: insertId,
    author: authorName,
    action: "Criação da OS",
    description: `Ordem de Serviço #${insertId} aberta com status "${data.status}".`,
  });

  return insertId;
}

export async function updateServiceOrderStatus(id: number, status: ServiceOrder["status"], authorName = "Sistema", notes = "") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(serviceOrders).set({ status, updatedAt: new Date() }).where(eq(serviceOrders.id, id));

  await db.insert(osHistory).values({
    serviceOrderId: id,
    author: authorName,
    action: "Alteração de Status",
    description: `Status alterado para "${status}". ${notes}`,
  });
}

export async function getServiceOrderHistory(serviceOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(osHistory)
    .where(eq(osHistory.serviceOrderId, serviceOrderId))
    .orderBy(desc(osHistory.createdAt));
}

export async function getServiceOrderParts(serviceOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(osParts)
    .where(eq(osParts.serviceOrderId, serviceOrderId))
    .orderBy(desc(osParts.createdAt));
}

export async function addServiceOrderPart(data: InsertOsPart, authorName = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.quantity <= 0) throw new Error("A quantidade deve ser maior que zero");

  const result = await db.insert(osParts).values(data);
  await db.insert(osHistory).values({
    serviceOrderId: data.serviceOrderId,
    author: authorName,
    action: "Peça adicionada",
    description: `Peça #${data.partId} adicionada à OS com quantidade ${data.quantity}.`,
  });
  return Number(result[0].insertId);
}

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) {
    return { clients: 0, equipments: 0, orders: 0, openOrders: 0, parts: 0 };
  }

  const [clientRows, equipmentRows, orderRows, partRows] = await Promise.all([
    db.select().from(clients),
    db.select().from(equipments),
    db.select().from(serviceOrders),
    db.select().from(parts),
  ]);

  const openStatuses = new Set(["opened", "diagnosing", "budget", "in_progress", "waiting_parts"]);
  const openOrders = orderRows.filter(order => openStatuses.has(order.status)).length;

  return {
    clients: clientRows.length,
    equipments: equipmentRows.length,
    orders: orderRows.length,
    openOrders,
    parts: partRows.length,
  };
}

export async function getRecentServiceOrders(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt)).limit(limit);
}

export async function createBudget(data: InsertBudget, author = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(budgets).values(data);
  const budgetId = Number(result[0].insertId);

  await db.insert(auditLogs).values({
    author,
    action: "Orçamento criado",
    entity: "budget",
    entityId: budgetId,
    details: `Orçamento gerado para OS #${data.serviceOrderId} com total de R$ ${data.total}`,
  });

  return budgetId;
}

export async function createWarranty(data: InsertWarranty, author = "Sistema") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(warranties).values(data);
  const warrantyId = Number(result[0].insertId);

  await db.insert(auditLogs).values({
    author,
    action: "Garantia registrada",
    entity: "warranty",
    entityId: warrantyId,
    details: `Garantia de ${data.warrantyDays} dias registrada para OS #${data.serviceOrderId}`,
  });

  return warrantyId;
}

export async function getAuditLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
