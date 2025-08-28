import { v4 as uuidv4 } from "uuid";
import { db } from "./index";
import { orders, orderItems } from "./schema";

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    const now = new Date().toISOString();
    const orderId1 = uuidv4();
    const orderId2 = uuidv4();

    // Insert test orders
    await db.insert(orders).values([
      {
        id: orderId1,
        customerId: "customer-123e4567-e89b-12d3-a456-426614174000",
        totalAmount: 129.98,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: orderId2,
        customerId: "customer-987f6543-e21c-43d5-b678-926614174001",
        totalAmount: 79.99,
        status: "confirmed",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Insert test order items
    await db.insert(orderItems).values([
      {
        id: uuidv4(),
        orderId: orderId1,
        productId: "product-111e2222-e33b-44d5-a666-777888999000",
        quantity: 2,
        price: 49.99,
      },
      {
        id: uuidv4(),
        orderId: orderId1,
        productId: "product-222f3333-e44c-55d6-b777-888999000111",
        quantity: 1,
        price: 29.99,
      },
      {
        id: uuidv4(),
        orderId: orderId2,
        productId: "product-333g4444-e55d-66e7-c888-999000111222",
        quantity: 1,
        price: 79.99,
      },
    ]);

    console.log(
      `Database seeded successfully with ${2} orders and ${3} order items`
    );
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Seeding failed:", errorMessage);
    process.exit(1);
  }
}

seedDatabase();
