# 📦 **Order Management System**

This app models a simple e-commerce workflow where customers place orders, and the system tracks them through different states.

It will consist of **two services** that communicate via APIs and events:

---

## 1. **Orders Service**

Responsible for creating and managing customer orders.

### API (REST via OAS)

- `POST /orders` → create a new order
- `GET /orders/{id}` → retrieve an order
- `PATCH /orders/{id}` → update status (`pending → paid → shipped → delivered`)
- `GET /orders?limit=&offset=` → list orders

### Events (AsyncAPI + CloudEvents)

- `order.created` (when new order is placed)
- `order.updated` (when status changes)

### Auth

- Requires `orders.read` and `orders.write` scopes.

### Logging

- Logs order lifecycle events with `trace_id` + `span_id`.

### Errors

- Returns `validation_error` if payload is invalid.
- Returns `not_found` if order doesn’t exist.

---

## 2. **Payments Service**

Responsible for handling payments for orders.

### API

- `POST /payments` → initiate a payment for an order
- `GET /payments/{id}` → retrieve payment status

### Events

- `payment.successful`
- `payment.failed`

### Auth

- Requires `payments.read` and `payments.write` scopes.

### Logging & Errors

Same rules as Orders Service.

---

## 🔄 Flow Example

1. **Customer places order** → `POST /orders`.

   - Orders Service emits `order.created`.

2. **Payment initiated** → Orders Service calls Payments Service `POST /payments`.
3. Payments Service processes payment:

   - If successful → emits `payment.successful`.
   - If failed → emits `payment.failed`.

4. Orders Service listens to `payment.successful` → updates order status → emits `order.updated`.

---

## 🗂 Example Service Manifest (Orders)

`service.yaml`

```yaml
name: orders
version: 1.0.0
owner: team-orders
api: ./openapi.yaml
events: ./asyncapi.yaml
auth:
  required_scopes:
    - orders.read
    - orders.write
```

---

## 📜 Example OpenAPI (Orders, Partial)

`openapi.yaml`

```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: 1.0.0
paths:
  /orders:
    post:
      summary: Create a new order
      security:
        - bearerAuth: [orders.write]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/OrderCreate"
      responses:
        "201":
          description: Order created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Order"
        "400":
          description: Invalid input
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/Error"
components:
  schemas:
    OrderCreate:
      type: object
      required: [customerId, items]
      properties:
        customerId:
          type: string
        items:
          type: array
          items:
            type: string
    Order:
      type: object
      required: [id, status, customerId, items]
      properties:
        id:
          type: string
        status:
          type: string
          enum: [pending, paid, shipped, delivered]
        customerId:
          type: string
        items:
          type: array
          items:
            type: string
    Error:
      type: object
      required: [type, title, status]
      properties:
        type:
          type: string
        title:
          type: string
        status:
          type: integer
```

---

## 📡 Example AsyncAPI (Orders, Partial)

`asyncapi.yaml`

```yaml
asyncapi: 2.6.0
info:
  title: Orders Events
  version: 1.0.0
channels:
  order.created:
    publish:
      message:
        $ref: "#/components/messages/OrderCreated"
  order.updated:
    publish:
      message:
        $ref: "#/components/messages/OrderUpdated"
components:
  messages:
    OrderCreated:
      contentType: application/cloudevents+json
      payload:
        type: object
        properties:
          id:
            type: string
          customerId:
            type: string
          items:
            type: array
            items:
              type: string
          status:
            type: string
            enum: [pending]
    OrderUpdated:
      contentType: application/cloudevents+json
      payload:
        type: object
        properties:
          id:
            type: string
          status:
            type: string
            enum: [pending, paid, shipped, delivered]
```
