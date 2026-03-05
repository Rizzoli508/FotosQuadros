import { orders, type InsertOrder, type Order } from "@shared/schema";

export interface IStorage {
  createOrder(order: InsertOrder): Promise<Order>;
}

export class MemStorage implements IStorage {
  private id = 1;

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = { ...order, id: this.id++ };
    return newOrder;
  }
}

export const storage = new MemStorage();