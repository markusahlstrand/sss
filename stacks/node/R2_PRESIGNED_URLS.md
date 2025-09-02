# R2 Pre-Signed URLs Implementation Guide

## Overview

This guide covers implementing AWS S3-compatible pre-signed URLs for Cloudflare R2 storage. Pre-signed URLs provide secure, time-limited access to private files without requiring authentication on every request.

## Why Pre-Signed URLs?

- **Security**: Time-limited access without exposing bucket credentials
- **Performance**: Direct client access to R2, no proxy overhead
- **Scalability**: No server-side authentication on file access
- **Standard**: Uses AWS Signature Version 4, widely supported

## Key Learning: JWT Tokens Don't Work

**❌ Wrong Approach**: Custom JWT tokens in query parameters

```typescript
// This doesn't work with R2!
const jwtToken = jwt.sign({ key, exp }, secret);
const url = `https://bucket.r2.dev/${key}?token=${jwtToken}`;
// R2 returns 403 - doesn't understand custom JWT validation
```

**✅ Correct Approach**: AWS Signature Version 4

```typescript
// This works with R2 natively!
const signedUrl = await generator.generatePresignedUrl(bucket, key, 28800);
// Returns: https://bucket.r2.cloudflarestorage.com/key?X-Amz-Signature=...
```

## Implementation

### 1. Environment Setup

```bash
# Set R2 API credentials as Worker secrets
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

To obtain credentials:

1. Cloudflare Dashboard → R2 → Manage R2 API tokens
2. Create token with "Read" permissions for your bucket
3. Copy Access Key ID and Secret Access Key

### 2. CloudflareEnv Interface

```typescript
interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}
```

### 3. Pre-Signed URL Generator

```typescript
class R2PreSignedUrlGenerator {
  constructor(
    private accessKeyId: string,
    private secretAccessKey: string,
    private region = "auto"
  ) {}

  async generatePresignedUrl(
    bucketName: string,
    key: string,
    expiresIn: number = 28800 // 8 hours
  ): Promise<string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);

    // Build canonical request
    const canonicalQuerystring = this.buildCanonicalQueryString({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.accessKeyId}/${dateStamp}/${this.region}/s3/aws4_request`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": expiresIn.toString(),
      "X-Amz-SignedHeaders": "host",
    });

    // Create string to sign and calculate signature
    const signature = await this.calculateSignature(/* ... */);

    return `https://${bucketName}.r2.cloudflarestorage.com/${key}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  }
}
```

### 4. Service Integration

```typescript
export class FileService {
  private presignedUrlGenerator: R2PreSignedUrlGenerator | null = null;

  constructor(
    private bucket: R2Bucket,
    r2AccessKeyId?: string,
    r2SecretAccessKey?: string
  ) {
    if (r2AccessKeyId && r2SecretAccessKey) {
      this.presignedUrlGenerator = new R2PreSignedUrlGenerator(
        r2AccessKeyId,
        r2SecretAccessKey
      );
    }
  }

  async uploadFile(key: string, buffer: ArrayBuffer): Promise<string> {
    // Upload to R2
    await this.bucket.put(key, buffer);

    // Generate pre-signed URL if credentials available
    if (this.presignedUrlGenerator) {
      return await this.presignedUrlGenerator.generatePresignedUrl(
        "bucket-name",
        key,
        28800 // 8 hours
      );
    }

    // Fallback to r2:// format
    return `r2://${key}`;
  }
}
```

## Critical Implementation Details

### 1. Crypto API TypeScript Issues

**Problem**: Workers runtime has strict ArrayBuffer typing

```typescript
// This causes TypeScript errors
await crypto.subtle.importKey('raw', uint8Array, ...);
```

**Solution**: Explicit ArrayBuffer creation

```typescript
private async hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  // Create clean ArrayBuffer to avoid SharedArrayBuffer type issues
  const keyBuffer = new ArrayBuffer(key.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(key);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer, // Use clean ArrayBuffer
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  // ...
}
```

### 2. URL Format Specifications

- **Host**: `{bucket-name}.r2.cloudflarestorage.com`
- **Algorithm**: `AWS4-HMAC-SHA256`
- **Region**: `auto` (Cloudflare's R2 region)
- **Service**: `s3` (maintains S3 compatibility)
- **Expiration**: 28800 seconds (8 hours)

### 3. Database Storage Strategy

```typescript
// Store R2 keys for URL regeneration
await repository.create({
  fileId: uuid(),
  r2Key: key,              // Store for regeneration
  url: `r2://${key}`,      // Database reference
  signedUrl: presignedUrl  // Current signed URL (optional)
});

// Regenerate fresh URLs on retrieval
async getFile(fileId: string) {
  const file = await repository.findById(fileId);

  if (file.url.startsWith('r2://') && this.presignedUrlGenerator) {
    const key = file.url.replace('r2://', '');
    const freshUrl = await this.presignedUrlGenerator.generatePresignedUrl(
      bucketName, key, 28800
    );
    return { ...file, url: freshUrl };
  }

  return file;
}
```

## Security Features

- **Cryptographic Signing**: HMAC-SHA256 with AWS v4 signature
- **Time-Limited**: URLs expire after specified duration
- **Tamper-Proof**: Any URL modification invalidates signature
- **Host Verification**: Signature includes host header validation
- **Native R2 Validation**: R2 validates signatures without custom code

## Error Handling

```typescript
// Graceful fallback strategy
async generateSignedUrlWithFallback(key: string): Promise<string> {
  if (!this.presignedUrlGenerator) {
    console.warn('R2 credentials not available, using r2:// fallback');
    return `r2://${key}`;
  }

  try {
    return await this.presignedUrlGenerator.generatePresignedUrl(
      bucketName, key, 28800
    );
  } catch (error) {
    console.error('Failed to generate pre-signed URL:', error);
    return `r2://${key}`; // Fallback for graceful degradation
  }
}
```

## Monitoring & Debugging

### Key Metrics

- Pre-signed URL generation success rate
- R2 authentication errors (403 responses)
- URL expiration rates
- Fallback to r2:// frequency

### Common Error Patterns

- **403 Forbidden**: Invalid signature or expired URL
- **TypeError**: Crypto API ArrayBuffer type issues
- **Missing credentials**: Fallback to r2:// format

## Production Considerations

1. **Credential Rotation**: Regularly rotate R2 API credentials
2. **URL Expiration**: Balance security (shorter) vs usability (longer)
3. **Caching**: Don't cache pre-signed URLs, generate fresh on each request
4. **Monitoring**: Track signing errors and R2 access patterns
5. **Custom Domains**: Consider branded domains instead of r2.cloudflarestorage.com

This implementation provides enterprise-grade secure file access with native R2 compatibility and excellent performance characteristics.
