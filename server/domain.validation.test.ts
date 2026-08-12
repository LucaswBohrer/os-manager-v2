import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Usuário de Teste",
    loginMethod: "test",
    role: "user",
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

describe("fundação do domínio", () => {
  it("retorna o health check sem depender do banco", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.system.health();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("os-manager");
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it("expõe o usuário autenticado no contexto", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.auth.me();

    expect(result?.openId).toBe("test-user");
    expect(result?.role).toBe("user");
  });

  it("rejeita uma nova OS com dados inválidos antes de acessar persistência", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.serviceOrders.create({
      clientId: 0,
      equipmentId: 1,
      defectReported: "x",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita cliente sem nome mínimo", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.clients.create({ name: "A" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
