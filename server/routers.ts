import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  addServiceOrderPart,
  createClient,
  createEquipment,
  createPart,
  createServiceOrder,
  getClients,
  getDashboardMetrics,
  getEquipments,
  getParts,
  getRecentServiceOrders,
  getServiceOrderHistory,
  getServiceOrderParts,
  getServiceOrders,
  updateServiceOrderStatus,
  updateServiceOrderDetails,
} from "./db";

const statusSchema = z.enum([
  "opened",
  "diagnosing",
  "budget",
  "in_progress",
  "waiting_parts",
  "completed",
  "delivered",
  "cancelled",
]);

const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({
      status: "ok" as const,
      service: "os-manager",
      timestamp: new Date().toISOString(),
    })),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Credenciais padrão do modo local-first para o Windows
        if (input.username === "admin" && input.password === "admin") {
          const adminOpenId = "local-admin-user";
          await db.upsertUser({
            openId: adminOpenId,
            name: "Administrador Local",
            email: "admin@osmanager.local",
            loginMethod: "local",
            lastSignedIn: new Date(),
          });
          const sessionToken = await sdk.createSessionToken(adminOpenId, {
            name: "Administrador Local",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          return { success: true } as const;
        }
        throw new Error("Usuário ou senha inválidos. Use admin / admin");
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  dashboard: router({
    metrics: protectedProcedure.query(() => getDashboardMetrics()),
    recentOrders: protectedProcedure.query(() => getRecentServiceOrders()),
  }),

  clients: router({
    list: protectedProcedure.query(() => getClients()),
    create: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(255),
        document: z.string().trim().max(32).optional(),
        phone: z.string().trim().max(32).optional(),
        email: z.string().trim().email().max(320).optional().or(z.literal("")),
        address: z.string().trim().max(2000).optional(),
        notes: z.string().trim().max(4000).optional(),
      }))
      .mutation(({ input }) => createClient(input)),
  }),

  equipments: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number().int().positive().optional() }).optional())
      .query(({ input }) => getEquipments(input?.clientId)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number().int().positive(),
        type: z.string().trim().min(2).max(128),
        brand: z.string().trim().max(128).optional(),
        model: z.string().trim().max(128).optional(),
        serialNumber: z.string().trim().max(128).optional(),
        specs: z.string().trim().max(4000).optional(),
      }))
      .mutation(({ input }) => createEquipment(input)),
  }),

  parts: router({
    list: protectedProcedure.query(() => getParts()),
    create: adminProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(255),
        sku: z.string().trim().max(64).optional(),
        stockQty: z.number().int().min(0).default(0),
        minStockQty: z.number().int().min(0).default(2),
        costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0.00"),
        sellPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0.00"),
      }))
      .mutation(({ input }) => createPart(input)),
  }),

  serviceOrders: router({
    list: protectedProcedure.query(() => getServiceOrders()),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number().int().positive(),
        equipmentId: z.number().int().positive(),
        defectReported: z.string().trim().min(3).max(10000),
        priority: prioritySchema.default("normal"),
        diagnosis: z.string().trim().max(10000).optional(),
        warrantyDays: z.number().int().min(0).max(3650).default(90),
      }))
      .mutation(({ input, ctx }) => createServiceOrder({
        ...input,
        status: "opened",
        laborCost: "0.00",
        partsCost: "0.00",
        discount: "0.00",
        totalAmount: "0.00",
      }, ctx.user.name ?? "Usuário")),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: statusSchema,
        notes: z.string().trim().max(4000).optional(),
      }))
      .mutation(({ input, ctx }) => updateServiceOrderStatus(
        input.id,
        input.status,
        ctx.user.name ?? "Usuário",
        input.notes ?? "",
      )),
    updateDetails: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        defectReported: z.string().trim().min(3).max(10000).optional(),
        diagnosis: z.string().trim().max(10000).optional(),
        priority: prioritySchema.optional(),
        warrantyDays: z.number().int().min(0).max(3650).optional(),
      }))
      .mutation(({ input }) => updateServiceOrderDetails(input.id, input)),
    history: protectedProcedure
      .input(z.object({ serviceOrderId: z.number().int().positive() }))
      .query(({ input }) => getServiceOrderHistory(input.serviceOrderId)),
    parts: protectedProcedure
      .input(z.object({ serviceOrderId: z.number().int().positive() }))
      .query(({ input }) => getServiceOrderParts(input.serviceOrderId)),
    addPart: protectedProcedure
      .input(z.object({
        serviceOrderId: z.number().int().positive(),
        partId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
      }))
      .mutation(({ input, ctx }) => addServiceOrderPart(input, ctx.user.name ?? "Usuário")),
  }),
});

export type AppRouter = typeof appRouter;
