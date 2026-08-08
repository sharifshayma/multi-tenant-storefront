import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

describe("tenancy schema", () => {
  it("exposes Store and StoreSettings models", () => {
    const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
    expect(models).toContain("Store");
    expect(models).toContain("StoreSettings");
  });
  it("adds storeId to the aggregate roots", () => {
    for (const model of ["Book", "Collection", "Order", "Transaction", "StockMovement"]) {
      const fields = Prisma.dmmf.datamodel.models.find((m) => m.name === model)!.fields.map((f) => f.name);
      expect(fields).toContain("storeId");
    }
  });
});
