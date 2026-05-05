import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  listBudgetsByProfile,
  findBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from "./budget-repository";

const PROFILE_ID = "user-1";
const OTHER_PROFILE_ID = "user-2";
const BUDGET_ID = "budget-1";

describe("budget-repository — ownership y filtros", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("listBudgetsByProfile filtra por profileId", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([]);
    await listBudgetsByProfile(PROFILE_ID);

    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: { profileId: PROFILE_ID },
      orderBy: { periodStart: "desc" },
    });
  });

  it("findBudgetById exige id Y profileId (no permite acceso cruzado)", async () => {
    vi.mocked(prisma.budget.findFirst).mockResolvedValue(null);
    await findBudgetById(BUDGET_ID, PROFILE_ID);

    expect(prisma.budget.findFirst).toHaveBeenCalledWith({
      where: { id: BUDGET_ID, profileId: PROFILE_ID },
    });
  });

  it("createBudget asocia el presupuesto al profileId pasado", async () => {
    const input = {
      amount: 50000,
      periodStart: new Date("2026-05-01"),
      periodEnd: new Date("2026-05-31"),
      category: "Transporte",
    };
    vi.mocked(prisma.budget.create).mockResolvedValue({} as never);

    await createBudget(PROFILE_ID, input);

    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: { profileId: PROFILE_ID, ...input },
    });
  });

  it("updateBudget usa updateMany con filtro id+profileId (ownership atómico)", async () => {
    vi.mocked(prisma.budget.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.budget.findUnique).mockResolvedValue({} as never);

    await updateBudget(BUDGET_ID, PROFILE_ID, {
      amount: 60000,
      periodStart: new Date(),
      periodEnd: new Date(),
      category: null,
    });

    expect(prisma.budget.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BUDGET_ID, profileId: PROFILE_ID },
      }),
    );
  });

  it("updateBudget devuelve null si el filtro no encuentra ningún row (otro user)", async () => {
    vi.mocked(prisma.budget.updateMany).mockResolvedValue({ count: 0 });

    const result = await updateBudget(BUDGET_ID, OTHER_PROFILE_ID, {
      amount: 60000,
      periodStart: new Date(),
      periodEnd: new Date(),
      category: null,
    });

    expect(result).toBeNull();
    expect(prisma.budget.findUnique).not.toHaveBeenCalled();
  });

  it("deleteBudget usa deleteMany filtrando por dueño y devuelve true si borró", async () => {
    vi.mocked(prisma.budget.deleteMany).mockResolvedValue({ count: 1 });

    const ok = await deleteBudget(BUDGET_ID, PROFILE_ID);

    expect(prisma.budget.deleteMany).toHaveBeenCalledWith({
      where: { id: BUDGET_ID, profileId: PROFILE_ID },
    });
    expect(ok).toBe(true);
  });

  it("deleteBudget devuelve false si el budget no pertenece al user (no toca data ajena)", async () => {
    vi.mocked(prisma.budget.deleteMany).mockResolvedValue({ count: 0 });

    const ok = await deleteBudget(BUDGET_ID, OTHER_PROFILE_ID);
    expect(ok).toBe(false);
  });
});
