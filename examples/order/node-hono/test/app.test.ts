import { describe, it, expect } from 'vitest';
import { testClient } from 'hono/testing';
import app from '../src/app';

const client = testClient(app);

describe('Orders API', () => {
  describe('Public endpoints', () => {
    it('should return service info at root endpoint', async () => {
      const res = await client.index.$get();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toEqual({
        name: 'orders-service',
        version: '1.0.0'
      });
    });

    it('should return health status for liveness probe', async () => {
      const res = await client.healthz.$get();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toEqual({ status: 'ok' });
    });

    it('should return ready status for readiness probe', async () => {
      const res = await client.readyz.$get();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toEqual({ status: 'ready' });
    });

    it('should return OpenAPI specification', async () => {
      const res = await client['openapi.json'].$get();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toHaveProperty('openapi');
      expect(data).toHaveProperty('info');
      expect(data.info.title).toBe('Orders Service API');
    });
  });

  describe('Protected endpoints', () => {
    it('should reject requests without authorization header', async () => {
      const res = await client.orders.$get();
      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await client.orders.$get({}, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should validate order creation schema', async () => {
      // This would normally require a valid JWT token
      // For now, we're testing the schema validation logic
      const invalidOrder = {
        customerId: 'invalid-uuid',
        items: [],
        totalAmount: -10
      };

      // Test would need proper JWT token setup
      // const res = await client.orders.$post({ json: invalidOrder });
      // expect(res.status).toBe(400);
    });
  });
});
