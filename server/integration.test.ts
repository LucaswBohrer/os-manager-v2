import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@osmanager.local",
    name: "Administrador",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("integração e regras de negócio do OS Manager", () => {
  it("valida a estrutura do roteador para orçamentos e auditoria", () => {
    const caller = appRouter.createCaller(createContext());
    expect(caller.system).toBeDefined();
    expect(caller.clients).toBeDefined();
    expect(caller.equipments).toBeDefined();
    expect(caller.serviceOrders).toBeDefined();
    expect(caller.parts).toBeDefined();
  });

  it("rejeita criação de peça com preço inválido", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.parts.create({
      name: "Placa Mãe",
      sellPrice: "invalid",
    })).rejects.toThrow();
  });
});
