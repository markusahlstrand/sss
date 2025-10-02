# 🗂 **CRM System Spec**

## Overview

- Multi-vendor system.
- All entities namespaced by `vendorId`.
- Products can be `pass | article | podcast | bundle`.
- Bundles can include multiple child products.
- Users have entitlements to products via purchase options or contracts.

---

# 1️⃣ Vendors Service

### API (REST)

| Endpoint              | Method | Description   |
| --------------------- | ------ | ------------- |
| `/vendors`            | POST   | Create vendor |
| `/vendors/{vendorId}` | GET    | Get vendor    |
| `/vendors`            | GET    | List vendors  |

### Events

- `vendor.created`
- `vendor.updated`

### Auth

- `vendors.read`
- `vendors.write`

---

# 2️⃣ Catalog Service

### API (REST)

| Endpoint                                                  | Method | Description                 |
| --------------------------------------------------------- | ------ | --------------------------- |
| `/vendors/{vendorId}/products`                            | POST   | Create product              |
| `/vendors/{vendorId}/products/{productId}`                | GET    | Retrieve product            |
| `/vendors/{vendorId}/products`                            | GET    | List products               |
| `/vendors/{vendorId}/products/{productId}/bundle-items`   | POST   | Add child product to bundle |
| `/vendors/{vendorId}/contracts`                           | POST   | Create contract             |
| `/vendors/{vendorId}/contracts/{contractId}`              | GET    | Get contract                |
| `/vendors/{vendorId}/purchase-options`                    | POST   | Create purchase option      |
| `/vendors/{vendorId}/purchase-options/{purchaseOptionId}` | GET    | Get purchase option         |

### Events

- `product.created`
- `product.updated`
- `bundleItem.added`
- `contract.created`
- `purchaseOption.created`

### Auth

- `catalog.read`
- `catalog.write`

---

# 3️⃣ Users & Entitlements Service

### API (REST)

| Endpoint                                           | Method | Description            |
| -------------------------------------------------- | ------ | ---------------------- |
| `/vendors/{vendorId}/users`                        | POST   | Create user            |
| `/vendors/{vendorId}/users/{userId}`               | GET    | Get user               |
| `/vendors/{vendorId}/entitlements`                 | POST   | Grant entitlement      |
| `/vendors/{vendorId}/entitlements/{entitlementId}` | GET    | Get entitlement        |
| `/vendors/{vendorId}/users/{userId}/entitlements`  | GET    | List user entitlements |

### Events

- `user.created`
- `entitlement.granted`
- `entitlement.revoked`

### Auth

- `users.read`, `users.write`
- `entitlements.read`, `entitlements.write`

---

# 4️⃣ Entities (Schemas)

### Vendor

```yaml
Vendor:
  type: object
  required: [vendorId, name]
  properties:
    vendorId:
      type: string
    name:
      type: string
    metadata:
      type: object
      additionalProperties: true
```

### Product

```yaml
Product:
  type: object
  required: [vendorId, productId, name, type]
  properties:
    vendorId: string
    productId: string
    name: string
    description: string
    type:
      type: string
      enum: [pass, article, podcast, bundle]
```

### ProductBundleItem

```yaml
ProductBundleItem:
  type: object
  required: [vendorId, productId, childProductId]
  properties:
    vendorId: string
    productId: string
    childProductId: string
```

### Contract

```yaml
Contract:
  type: object
  required: [vendorId, contractId, productId, terms]
  properties:
    vendorId: string
    contractId: string
    productId: string
    terms: string
```

### PurchaseOption

```yaml
PurchaseOption:
  type: object
  required: [vendorId, purchaseOptionId, productId, price, billingCycle]
  properties:
    vendorId: string
    purchaseOptionId: string
    productId: string
    price: number
    billingCycle:
      type: string
      enum: [monthly, yearly, one-time]
```

### User

```yaml
User:
  type: object
  required: [vendorId, userId, email]
  properties:
    vendorId: string
    userId: string
    email: string
    profile: object
```

### Entitlement

```yaml
Entitlement:
  type: object
  required:
    [vendorId, entitlementId, userId, productId, purchaseOptionId, status]
  properties:
    vendorId: string
    entitlementId: string
    userId: string
    productId: string
    purchaseOptionId: string
    contractId:
      type: string
      nullable: true
    status:
      type: string
      enum: [active, expired, revoked]
```

---

# 5️⃣ Relationships

```
Vendor
  ├── Products (1:N)
  │     ├── Contracts (1:N)
  │     ├── PurchaseOptions (1:N)
  │     └── BundleItems (1:N)
  ├── Users (1:N)
  │     └── Entitlements (1:N)
  │           ├── Product (N:1)
  │           ├── PurchaseOption (N:1)
  │           └── Contract (N:1, optional)
```

---

# 6️⃣ AsyncAPI (Events)

```yaml
channels:
  vendor.created:
    publish:
      message:
        payload: { vendorId: string, name: string }
  product.created:
    publish:
      message:
        payload: { vendorId: string, productId: string, type: string }
  bundleItem.added:
    publish:
      message:
        payload: { vendorId: string, productId: string, childProductId: string }
  contract.created:
    publish:
      message:
        payload: { vendorId: string, contractId: string, productId: string }
  purchaseOption.created:
    publish:
      message:
        payload:
          { vendorId: string, purchaseOptionId: string, productId: string }
  user.created:
    publish:
      message:
        payload: { vendorId: string, userId: string, email: string }
  entitlement.granted:
    publish:
      message:
        payload:
          {
            vendorId: string,
            entitlementId: string,
            userId: string,
            productId: string,
            purchaseOptionId: string,
          }
  entitlement.revoked:
    publish:
      message:
        payload: { vendorId: string, entitlementId: string }
```

---

# 7️⃣ Flow Example

1. Vendor `v1` created → `vendor.created`.
2. Product `p1` type `bundle` → `product.created`.
3. Bundle includes `p2` and `p3` → `bundleItem.added`.
4. Purchase option `po1` created for `p1` → `purchaseOption.created`.
5. User `u1` created → `user.created`.
6. Grant entitlement `e1` → `entitlement.granted`.
