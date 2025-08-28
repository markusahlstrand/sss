# Node.js Databases - Service Standard v1

Database integration options for Node.js services that maintain Service Standard v1 compliance while providing robust data persistence.

## Available Options

### [Drizzle + SQLite](./drizzle-sqlite.md) - Type-Safe File Database

**Best for: Development, microservices, edge deployment, moderate data requirements**

- ✅ **Full type safety** with compile-time schema validation
- ✅ **Zero configuration** - embedded file-based database
- ✅ **Excellent developer experience** with Drizzle Studio and migrations
- ✅ **Production ready** with ACID compliance and transactions
- ✅ **Edge compatible** - works in serverless and edge environments
- ✅ **Cost effective** - no database server required
- ✅ **Simple deployment** - single file database with easy backups

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

**📖 [Complete Drizzle + SQLite Guide →](./drizzle-sqlite.md)**

## Coming Soon

### Drizzle + PostgreSQL - Scalable Relational Database

**Best for: Production applications, high concurrency, complex queries**

- Type-safe ORM with PostgreSQL's advanced features
- Connection pooling and advanced performance optimization
- Full ACID compliance with advanced transaction support
- Horizontal scaling capabilities
- Rich ecosystem of PostgreSQL extensions

### Prisma + PostgreSQL - Full-Featured ORM

**Best for: Rapid development, team collaboration, complex data models**

- Declarative schema with automatic migrations
- Built-in query optimization and caching
- Excellent tooling with Prisma Studio
- Strong TypeScript integration
- Advanced features like soft deletes and middleware

### MongoDB + Mongoose - Document Database

**Best for: Flexible schemas, JSON-heavy applications, rapid prototyping**

- Schema-less design with optional validation
- Native JSON storage and querying
- Horizontal scaling with sharding support
- Rich aggregation pipeline for analytics

## Database Selection Guide

### Choose **Drizzle + SQLite** if:

- Building microservices or serverless applications
- Need simple deployment without database infrastructure
- Working with moderate data volumes (< 100GB)
- Want excellent developer experience with type safety
- Deploying to edge computing platforms
- Building prototypes or MVPs quickly

### Choose **Drizzle + PostgreSQL** if:

- Building production applications with complex queries
- Need advanced database features (JSON columns, full-text search, etc.)
- Require high concurrency and write-heavy workloads
- Want to leverage PostgreSQL's rich ecosystem
- Building multi-tenant applications with data isolation

### Choose **Prisma + PostgreSQL** if:

- Working in teams that need collaboration features
- Want declarative schema management
- Need advanced ORM features out of the box
- Building applications with complex relationships
- Prefer generated client over query builders

### Choose **MongoDB + Mongoose** if:

- Working with highly variable or nested data structures
- Building content management or catalog systems
- Need flexible schema evolution
- Working with JSON-heavy APIs
- Building applications requiring horizontal scaling

## Service Standard v1 Integration

All database options must integrate with Service Standard v1 requirements:

### Health Checks

```typescript
// Database health check endpoint
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.select({ test: sql`1` });
    return true;
  } catch (error) {
    return false;
  }
}
```

### Error Handling

```typescript
// RFC 7807 error mapping for database errors
export class DatabaseErrorHandler {
  static mapError(error: unknown): ProblemJsonError {
    if (error instanceof ValidationError) {
      return new ProblemJsonError("validation_error", 400, error.message);
    }
    if (error instanceof UniqueConstraintError) {
      return new ProblemJsonError("conflict", 409, "Resource already exists");
    }
    return new ProblemJsonError(
      "internal_error",
      500,
      "Database operation failed"
    );
  }
}
```

### Repository Pattern

```typescript
// Standard repository interface for Service Standard v1
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  findMany(options: FindOptions): Promise<T[]>;
}
```

### Event Integration

```typescript
// Database operations trigger CloudEvents
export class ServiceWithEvents {
  async createResource(data: ResourceData): Promise<Resource> {
    const resource = await this.repository.create(data);

    // Publish CloudEvent
    await this.eventService.publish("resource.created", {
      resourceId: resource.id,
      resourceType: "resource",
      timestamp: new Date().toISOString(),
    });

    return resource;
  }
}
```

## Environment Configuration

All database implementations should support configuration through environment variables:

```bash
# Database connection
DATABASE_URL=sqlite:./data/app.db
# or DATABASE_URL=postgresql://user:pass@host:5432/db
# or DATABASE_URL=mongodb://host:27017/db

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Performance settings
DATABASE_QUERY_TIMEOUT=5000
DATABASE_STATEMENT_TIMEOUT=10000

# Health check settings
DATABASE_HEALTH_CHECK_TIMEOUT=1000
```

## Testing Strategy

### Test Database Setup

```typescript
// Consistent test setup across all database options
export async function setupTestDatabase() {
  const testDbUrl = process.env.TEST_DATABASE_URL || ":memory:";
  const db = await createDatabase(testDbUrl);

  // Run migrations
  await runMigrations(db);

  return db;
}

export async function cleanupTestDatabase(db: Database) {
  await db.close();
}
```

### Repository Testing

```typescript
// Standard test patterns for all repositories
describe("Repository", () => {
  let db: Database;
  let repository: Repository<Resource>;

  beforeEach(async () => {
    db = await setupTestDatabase();
    repository = new ResourceRepository(db);
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  it("should create and retrieve resources", async () => {
    const data = { name: "Test Resource" };
    const resource = await repository.create(data);

    expect(resource).toBeDefined();
    expect(resource.name).toBe(data.name);

    const found = await repository.findById(resource.id);
    expect(found).toEqual(resource);
  });
});
```

## Migration Management

All database options should provide consistent migration patterns:

```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Rollback migration
npm run db:rollback

# View migration status
npm run db:status
```

## Performance Monitoring

Database performance should integrate with Service Standard v1 observability:

```typescript
// OpenTelemetry database instrumentation
import { trace } from "@opentelemetry/api";

export class InstrumentedRepository<T> implements Repository<T> {
  async findById(id: string): Promise<T | null> {
    return trace
      .getTracer("database")
      .startActiveSpan("db.findById", async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "db.table": this.tableName,
          "resource.id": id,
        });

        try {
          const result = await this.baseRepository.findById(id);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          throw error;
        } finally {
          span.end();
        }
      });
  }
}
```

## Next Steps

1. **Review database options** based on your application requirements
2. **Check router compatibility** - some combinations work better together
3. **Consider deployment environment** - serverless vs. traditional servers
4. **Evaluate data requirements** - volume, complexity, and growth patterns
5. **Plan migration strategy** - how to evolve if requirements change

---

Each database option includes complete integration examples with all major Node.js routers (NestJS, Fastify, Hono) and maintains full Service Standard v1 compliance.
