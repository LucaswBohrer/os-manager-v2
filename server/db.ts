import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "os_manager.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      users: [
        {
          id: 1,
          openId: "local-admin-user",
          name: "Administrador Local",
          email: "admin@osmanager.local",
          loginMethod: "local",
          lastSignedIn: new Date().toISOString(),
        },
      ],
      clients: [],
      equipments: [],
      parts: [],
      serviceOrders: [],
      budgets: [],
      warranties: [],
      auditLogs: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

export function readData() {
  ensureDataFile();
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("[Database] Error reading local data file:", e);
    return {
      users: [],
      clients: [],
      equipments: [],
      parts: [],
      serviceOrders: [],
      budgets: [],
      warranties: [],
      auditLogs: [],
    };
  }
}

export function writeData(data: any) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Funções de Usuário
export async function getUserByOpenId(openId: string) {
  const db = readData();
  return db.users.find((u: any) => u.openId === openId) || null;
}

export async function upsertUser(user: any) {
  const db = readData();
  const index = db.users.findIndex((u: any) => u.openId === user.openId);
  if (index >= 0) {
    db.users[index] = { ...db.users[index], ...user };
  } else {
    db.users.push({ id: db.users.length + 1, ...user });
  }
  writeData(db);
}

// Clientes
export async function getClients() {
  const db = readData();
  return db.clients;
}

export async function createClient(data: any) {
  const db = readData();
  const newClient = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
  db.clients.push(newClient);
  writeData(db);
  return newClient;
}

// Equipamentos
export async function getEquipments(clientId?: number) {
  const db = readData();
  if (clientId) {
    return db.equipments.filter((e: any) => e.clientId === clientId);
  }
  return db.equipments;
}

export async function createEquipment(data: any) {
  const db = readData();
  const newEq = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
  db.equipments.push(newEq);
  writeData(db);
  return newEq;
}

// Peças / Estoque
export async function getParts() {
  const db = readData();
  return db.parts;
}

export async function createPart(data: any) {
  const db = readData();
  const newPart = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
  db.parts.push(newPart);
  writeData(db);
  return newPart;
}

export async function updatePartStock(partId: number, quantityChange: number) {
  const db = readData();
  const part = db.parts.find((p: any) => p.id === partId);
  if (part) {
    part.stockQty = Math.max(0, (part.stockQty || 0) + quantityChange);
    writeData(db);
  }
  return part;
}

// Ordens de Serviço
export async function getServiceOrders() {
  const db = readData();
  let changed = false;
  (db.serviceOrders || []).forEach((o: any, idx: number) => {
    if (!o.sequentialNumber || !o.displayNumber) {
      const seq = o.sequentialNumber || (idx + 1);
      o.sequentialNumber = seq;
      o.displayNumber = o.displayNumber || String(seq).padStart(5, '0');
      changed = true;
    }
  });
  if (changed) {
    writeData(db);
  }
  return db.serviceOrders;
}

export async function getServiceOrderById(id: number) {
  const db = readData();
  return db.serviceOrders.find((o: any) => o.id === id) || null;
}

export async function createServiceOrder(data: any, author: string = "Usuário") {
  const db = readData();
  const nextSeq = db.serviceOrders.length > 0 
    ? Math.max(...db.serviceOrders.map((o: any) => o.sequentialNumber || 0)) + 1 
    : 1;
  const formattedSeq = String(nextSeq).padStart(5, '0');

  const newOrder = {
    id: Date.now(),
    sequentialNumber: nextSeq,
    displayNumber: formattedSeq,
    ...data,
    status: data.status || "opened",
    priority: data.priority || "normal",
    timeline: [{ date: new Date().toISOString(), action: "OS Criada", description: `Ordem de serviço #${formattedSeq} aberta por ${author}.` }],
    createdAt: new Date().toISOString(),
  };
  db.serviceOrders.push(newOrder);
  writeData(db);
  return newOrder;
}

export async function updateServiceOrderStatus(id: number, status: string, author: string, notes: string = "") {
  const db = readData();
  const order = db.serviceOrders.find((o: any) => o.id === id);
  if (order) {
    order.status = status;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({ date: new Date().toISOString(), action: "Status Alterado", description: `Status alterado para ${status} por ${author}. ${notes}` });
    writeData(db);
  }
  return order;
}

export async function updateServiceOrderDetails(id: number, data: any) {
  const db = readData();
  const order = db.serviceOrders.find((o: any) => o.id === id);
  if (order) {
    Object.assign(order, data);
    if (!order.timeline) order.timeline = [];
    order.timeline.push({ date: new Date().toISOString(), action: "Atualização de OS", description: `Detalhes atualizados.` });
    writeData(db);
  }
  return order;
}

export async function getServiceOrderHistory(serviceOrderId: number) {
  const db = readData();
  const order = db.serviceOrders.find((o: any) => o.id === serviceOrderId);
  return order ? order.timeline || [] : [];
}

export async function getServiceOrderParts(serviceOrderId: number) {
  const db = readData();
  return (db.serviceOrderParts || []).filter((p: any) => p.serviceOrderId === serviceOrderId);
}

export async function addServiceOrderPart(input: any, author: string) {
  const db = readData();
  if (!db.serviceOrderParts) db.serviceOrderParts = [];
  const item = { id: Date.now(), ...input, createdAt: new Date().toISOString() };
  db.serviceOrderParts.push(item);
  const order = db.serviceOrders.find((o: any) => o.id === input.serviceOrderId);
  if (order) {
    if (!order.timeline) order.timeline = [];
    order.timeline.push({ date: new Date().toISOString(), action: "Peça Adicionada", description: `Peça adicionada por ${author}.` });
  }
  writeData(db);
  return item;
}

// Métricas e Resumos para Dashboard
export async function getDashboardMetrics() {
  const db = readData();
  const orders = db.serviceOrders || [];
  const clients = db.clients || [];
  const parts = db.parts || [];

  const totalOrders = orders.length;
  const openedOrders = orders.filter((o: any) => o.status === "opened" || o.status === "in_progress" || o.status === "diagnosing").length;
  const completedOrders = orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length;
  const totalClients = clients.length;
  const lowStockParts = parts.filter((p: any) => (p.stockQty || 0) <= (p.minStock || 2)).length;

  // Compatibilidade com Home.tsx: clients, openOrders, equipments, parts
  const equipments = db.equipments || [];
  return {
    clients: totalClients,
    openOrders: openedOrders,
    equipments: equipments.length,
    parts: parts.length,
    totalOrders,
    completedOrders,
    lowStockParts,
  };
}

export async function getRecentServiceOrders(limit: number = 5) {
  const db = readData();
  const orders = db.serviceOrders || [];
  return orders
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
