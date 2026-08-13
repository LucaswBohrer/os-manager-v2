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
export async function getEquipments() {
  const db = readData();
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
  return db.serviceOrders;
}

export async function getServiceOrderById(id: number) {
  const db = readData();
  return db.serviceOrders.find((o: any) => o.id === id) || null;
}

export async function createServiceOrder(data: any) {
  const db = readData();
  const newOrder = {
    id: Date.now(),
    ...data,
    status: data.status || "Pendente",
    priority: data.priority || "Normal",
    timeline: [{ date: new Date().toISOString(), action: "OS Criada", description: "Ordem de serviço aberta no sistema local." }],
    createdAt: new Date().toISOString(),
  };
  db.serviceOrders.push(newOrder);
  writeData(db);
  return newOrder;
}

export async function updateServiceOrderDetails(id: number, data: any) {
  const db = readData();
  const order = db.serviceOrders.find((o: any) => o.id === id);
  if (order) {
    Object.assign(order, data);
    if (!order.timeline) order.timeline = [];
    order.timeline.push({ date: new Date().toISOString(), action: "Atualização de OS", description: `Status alterado para: ${data.status || order.status}` });
    writeData(db);
  }
  return order;
}
