import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "os_manager.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [
        {
          id: 1,
          openId: "local-admin-user",
          name: "Administrador Local",
          email: "admin@osmanager.local",
          loginMethod: "local",
          role: "admin",
          lastSignedIn: new Date().toISOString(),
        }
      ],
      clients: [],
      equipments: [],
      parts: [],
      serviceOrders: [],
      osParts: [],
      osHistory: [],
      budgets: [],
      warranties: [],
      auditLogs: [],
      counters: {
        clients: 0,
        equipments: 0,
        parts: 0,
        serviceOrders: 0,
        osParts: 0,
        osHistory: 0,
        budgets: 0,
        warranties: 0,
        auditLogs: 0,
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

function readData() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Database] Error reading local JSON DB:", err);
    ensureStorage();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  }
}

function writeData(data: any) {
  ensureStorage();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getDb() {
  return { isLocal: true };
}

export async function getUserByOpenId(openId: string) {
  const data = readData();
  return data.users.find((u: any) => u.openId === openId) || null;
}

export async function upsertUser(user: any) {
  const data = readData();
  const idx = data.users.findIndex((u: any) => u.openId === user.openId);
  if (idx >= 0) {
    data.users[idx] = { ...data.users[idx], ...user, lastSignedIn: new Date().toISOString() };
  } else {
    data.counters.users = (data.counters.users || 0) + 1;
    data.users.push({
      id: data.counters.users,
      role: "admin",
      ...user,
      lastSignedIn: new Date().toISOString(),
    });
  }
  writeData(data);
}

export async function getClients() {
  const data = readData();
  return (data.clients || []).sort((a: any, b: any) => b.id - a.id);
}

export async function createClient(clientData: any) {
  const data = readData();
  data.counters.clients = (data.counters.clients || 0) + 1;
  const newClient = {
    id: data.counters.clients,
    ...clientData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.clients.push(newClient);
  writeData(data);
  return newClient.id;
}

export async function getEquipments(clientId?: number) {
  const data = readData();
  let list = data.equipments || [];
  if (clientId) {
    list = list.filter((eq: any) => eq.clientId === clientId);
  }
  return list.sort((a: any, b: any) => b.id - a.id);
}

export async function createEquipment(eqData: any) {
  const data = readData();
  data.counters.equipments = (data.counters.equipments || 0) + 1;
  const newEq = {
    id: data.counters.equipments,
    ...eqData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.equipments.push(newEq);
  writeData(data);
  return newEq.id;
}

export async function getParts() {
  const data = readData();
  return (data.parts || []).sort((a: any, b: any) => b.id - a.id);
}

export async function createPart(partData: any) {
  const data = readData();
  data.counters.parts = (data.counters.parts || 0) + 1;
  const newPart = {
    id: data.counters.parts,
    ...partData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.parts.push(newPart);
  writeData(data);
  return newPart.id;
}

export async function updatePartStock(partId: number, quantityChange: number, authorName = "Sistema") {
  const data = readData();
  const part = (data.parts || []).find((p: any) => p.id === partId);
  if (!part) throw new Error("Peça não encontrada");
  const newQty = part.stockQty + quantityChange;
  if (newQty < 0) throw new Error("Estoque insuficiente para esta operação");
  part.stockQty = newQty;
  part.updatedAt = new Date().toISOString();
  writeData(data);
}

export async function getServiceOrders() {
  const data = readData();
  return (data.serviceOrders || []).sort((a: any, b: any) => b.id - a.id);
}

export async function getServiceOrderById(id: number) {
  const data = readData();
  return (data.serviceOrders || []).find((o: any) => o.id === id) || null;
}

export async function createServiceOrder(orderData: any, authorName = "Sistema") {
  const data = readData();
  data.counters.serviceOrders = (data.counters.serviceOrders || 0) + 1;
  const newOrder = {
    id: data.counters.serviceOrders,
    ...orderData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.serviceOrders.push(newOrder);

  data.counters.osHistory = (data.counters.osHistory || 0) + 1;
  data.osHistory.push({
    id: data.counters.osHistory,
    serviceOrderId: newOrder.id,
    author: authorName,
    action: "Criação da OS",
    description: `Ordem de Serviço #${newOrder.id} aberta com status "${newOrder.status}".`,
    createdAt: new Date().toISOString(),
  });

  writeData(data);
  return newOrder.id;
}

export async function updateServiceOrderStatus(id: number, status: string, authorName = "Sistema", notes = "") {
  const data = readData();
  const order = (data.serviceOrders || []).find((o: any) => o.id === id);
  if (!order) throw new Error("OS não encontrada");
  order.status = status;
  order.updatedAt = new Date().toISOString();

  data.counters.osHistory = (data.counters.osHistory || 0) + 1;
  data.osHistory.push({
    id: data.counters.osHistory,
    serviceOrderId: id,
    author: authorName,
    action: "Alteração de Status",
    description: `Status alterado para "${status}". ${notes}`,
    createdAt: new Date().toISOString(),
  });

  writeData(data);
}

export async function updateServiceOrderDetails(id: number, diagnosis: string, laborCost: string, partsCost: string, discount: string, totalAmount: string, authorName = "Sistema") {
  const data = readData();
  const order = (data.serviceOrders || []).find((o: any) => o.id === id);
  if (!order) throw new Error("OS não encontrada");
  order.diagnosis = diagnosis;
  order.laborCost = laborCost;
  order.partsCost = partsCost;
  order.discount = discount;
  order.totalAmount = totalAmount;
  order.updatedAt = new Date().toISOString();

  data.counters.osHistory = (data.counters.osHistory || 0) + 1;
  data.osHistory.push({
    id: data.counters.osHistory,
    serviceOrderId: id,
    author: authorName,
    action: "Atualização de Orçamento/Diagnóstico",
    description: `Diagnóstico e orçamento atualizados. Total: R$ ${totalAmount}`,
    createdAt: new Date().toISOString(),
  });

  writeData(data);
}

export async function getServiceOrderHistory(serviceOrderId: number) {
  const data = readData();
  return (data.osHistory || [])
    .filter((h: any) => h.serviceOrderId === serviceOrderId)
    .sort((a: any, b: any) => b.id - a.id);
}

export async function getServiceOrderParts(serviceOrderId: number) {
  const data = readData();
  return (data.osParts || [])
    .filter((p: any) => p.serviceOrderId === serviceOrderId)
    .sort((a: any, b: any) => b.id - a.id);
}

export async function addServiceOrderPart(partData: any, authorName = "Sistema") {
  const data = readData();
  if (partData.quantity <= 0) throw new Error("A quantidade deve ser maior que zero");

  data.counters.osParts = (data.counters.osParts || 0) + 1;
  const newOsPart = {
    id: data.counters.osParts,
    ...partData,
    createdAt: new Date().toISOString(),
  };
  data.osParts.push(newOsPart);

  data.counters.osHistory = (data.counters.osHistory || 0) + 1;
  data.osHistory.push({
    id: data.counters.osHistory,
    serviceOrderId: partData.serviceOrderId,
    author: authorName,
    action: "Peça adicionada",
    description: `Peça #${partData.partId} adicionada à OS com quantidade ${partData.quantity}.`,
    createdAt: new Date().toISOString(),
  });

  writeData(data);
  return newOsPart.id;
}

export async function getDashboardMetrics() {
  const data = readData();
  const clients = data.clients || [];
  const equipments = data.equipments || [];
  const orders = data.serviceOrders || [];
  const parts = data.parts || [];

  const openStatuses = new Set(["opened", "diagnosing", "budget", "in_progress", "waiting_parts"]);
  const openOrders = orders.filter((o: any) => openStatuses.has(o.status)).length;

  return {
    clients: clients.length,
    equipments: equipments.length,
    orders: orders.length,
    openOrders,
    parts: parts.length,
  };
}

export async function getRecentServiceOrders(limit = 5) {
  const data = readData();
  return (data.serviceOrders || [])
    .sort((a: any, b: any) => b.id - a.id)
    .slice(0, limit);
}
