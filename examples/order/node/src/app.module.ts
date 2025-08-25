import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { OrdersModule } from "./orders/orders.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [AuthModule, OrdersModule, HealthModule, EventsModule],
  controllers: [AppController],
})
export class AppModule {}
