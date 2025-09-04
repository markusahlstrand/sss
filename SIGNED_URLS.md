# R2 Pre-Signed URLs Implementation Guide

This document provides implementation guidance for secure file access using Cloudflare R2 pre-signed URLs, based on successful production deployment in September 2025.

## Overview

R2 pre-signed URLs provide secure, time-limited access to files stored in Cloudflare R2 buckets without exposing credentials or requiring authentication headers. This is essential for:

- **Direct file access** from web browsers and mobile apps
- **Secure sharing** of private media files
- **Temporary access** without permanent public URLs
- **Custom domain integration** for branded file URLs

## Implementation Architecture

### Storage Pattern

```typescript
// Store R2 keys in database
const imageUpload = {
  id: fileId,
  fileName: "example.jpg",
  url: "r2://images/shows/abc123/file456/example.jpg", // Internal R2 key
  uploadedAt: new Date().toISOString(),
};
```

### On-Demand URL Generation

```typescript
// Generate signed URLs when serving API responses
const signedUrl = await generateSignedUrl(
  "r2://images/shows/abc123/file456/example.jpg"
);
// Returns: https://podcast-media.sesamy.dev/images/shows/abc123/file456/example.jpg?X-Amz-Signature=...
```

## Core Implementation

### 1. R2 Pre-Signed URL Generator

```typescript
export class R2PreSignedUrlGenerator {
  private accessKeyId: string;
  private secretAccessKey: string;
  private endpoint?: string; // Custom domain endpoint

  constructor(accessKeyId: string, secretAccessKey: string, endpoint?: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.endpoint = endpoint; // e.g., "https://podcast-media.sesamy.dev"
  }

  async generatePresignedUrl(
    bucketName: string,
    key: string,
    expiresIn: number = 28800
  ): Promise<string> {
    try {
      // AWS Signature Version 4 implementation
      const region = "auto";
      const service = "s3";
      const method = "GET";

      const now = new Date();
      const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timestamp =
        now.toISOString().slice(0, 19).replace(/[-:]/g, "") + "Z";

      // Build canonical request
      const host = this.endpoint
        ? new URL(this.endpoint).host
        : `${bucketName}.r2.cloudflarestorage.com`;

      const canonicalUri = `/${key}`;
      const canonicalQuerystring = this.buildCanonicalQueryString(
        timestamp,
        datestamp,
        expiresIn
      );
      const canonicalHeaders = `host:${host}\n`;
      const signedHeaders = "host";

      const canonicalRequest = [
        method,
        canonicalUri,
        canonicalQuerystring,
        canonicalHeaders,
        signedHeaders,
        "UNSIGNED-PAYLOAD",
      ].join("\n");

      // Create string to sign
      const algorithm = "AWS4-HMAC-SHA256";
      const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
      const stringToSign = [
        algorithm,
        timestamp,
        credentialScope,
        await this.sha256(canonicalRequest),
      ].join("\n");

      // Calculate signature
      const signature = await this.calculateSignature(
        stringToSign,
        datestamp,
        region,
        service
      );

      // Build final URL
      const baseUrl = this.endpoint ? this.endpoint : `https://${host}`;
      const signedUrl = `${baseUrl}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;

      return signedUrl;
    } catch (error) {
      console.error("Failed to generate pre-signed URL:", error);
      // Graceful fallback to r2:// format
      return `r2://${key}`;
    }
  }

  private buildCanonicalQueryString(
    timestamp: string,
    datestamp: string,
    expiresIn: number
  ): string {
    const params = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.accessKeyId}/${datestamp}/auto/s3/aws4_request`,
      "X-Amz-Date": timestamp,
      "X-Amz-Expires": expiresIn.toString(),
      "X-Amz-SignedHeaders": "host",
    });

    return params.toString();
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private async calculateSignature(
    stringToSign: string,
    datestamp: string,
    region: string,
    service: string
  ): Promise<string> {
    const getSignatureKey = async (
      key: string,
      dateStamp: string,
      regionName: string,
      serviceName: string
    ) => {
      const kDate = await this.hmacSha256(`AWS4${key}`, dateStamp);
      const kRegion = await this.hmacSha256(kDate, regionName);
      const kService = await this.hmacSha256(kRegion, serviceName);
      const kSigning = await this.hmacSha256(kService, "aws4_request");
      return kSigning;
    };

    const signingKey = await getSignatureKey(
      this.secretAccessKey,
      datestamp,
      region,
      service
    );
    const signature = await this.hmacSha256(signingKey, stringToSign);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async hmacSha256(
    key: string | ArrayBuffer,
    message: string
  ): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      typeof key === "string" ? new TextEncoder().encode(key) : key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    return await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(message)
    );
  }
}
```

### 2. Service Integration

```typescript
export class ImageService {
  private r2PreSignedUrlGenerator: R2PreSignedUrlGenerator | null = null;

  constructor(
    bucket?: R2Bucket,
    r2AccessKeyId?: string,
    r2SecretAccessKey?: string,
    r2Endpoint?: string
  ) {
    if (r2AccessKeyId && r2SecretAccessKey) {
      this.r2PreSignedUrlGenerator = new R2PreSignedUrlGenerator(
        r2AccessKeyId,
        r2SecretAccessKey,
        r2Endpoint // Custom domain support
      );
    }
  }

  async signImageUrl(url: string): Promise<string> {
    if (!url || !url.startsWith("r2://")) {
      return url;
    }

    if (!this.r2PreSignedUrlGenerator) {
      console.warn("No pre-signed URL generator available");
      return url;
    }

    const key = url.replace("r2://", "");
    return await this.r2PreSignedUrlGenerator.generatePresignedUrl(
      "bucket-name",
      key
    );
  }
}
```

### 3. API Response Integration

```typescript
// Automatically sign URLs in API responses
async function signImageUrlInShow(show: any, audioService?: AudioService) {
  if (!show.imageUrl || !show.imageUrl.startsWith("r2://") || !audioService) {
    return show;
  }

  try {
    const signedUrl = await audioService.generateSignedUrlFromKey(
      show.imageUrl.replace("r2://", "")
    );

    if (signedUrl) {
      return { ...show, imageUrl: signedUrl };
    }
  } catch (error) {
    console.warn("Failed to sign imageUrl for show:", show.id, error);
  }

  return show;
}
```

## Configuration

### Environment Variables

```bash
# Required for pre-signed URL generation
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key

# Optional: Custom domain for branded URLs
R2_ENDPOINT=https://podcast-media.sesamy.dev
```

### Cloudflare Workers Configuration

```toml
# wrangler.toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "your-bucket-name"

[vars]
R2_ENDPOINT = "https://your-custom-domain.com"

# Set secrets via CLI:
# wrangler secret put R2_ACCESS_KEY_ID
# wrangler secret put R2_SECRET_ACCESS_KEY
```

## Security Considerations

### URL Expiration

- **Default expiration**: 8 hours (28800 seconds)
- **Configurable** based on use case (shorter for sensitive content)
- **Automatic renewal** not supported - generate fresh URLs as needed

### Access Control

- Pre-signed URLs **bypass** normal authentication
- Only generate for **authorized users**
- Consider **IP restrictions** for highly sensitive content
- **Log access** for audit trails

### Custom Domains

Custom domains provide:

- **Branded URLs** for better user experience
- **CORS compatibility** with your application domain
- **SSL/TLS termination** at the edge
- **Geographic distribution** via Cloudflare's global network

## Error Handling

### Graceful Fallbacks

```typescript
try {
  const signedUrl = await generateSignedUrl(r2Key);
  return signedUrl;
} catch (error) {
  console.error("Failed to generate signed URL:", error);
  // Fallback to original r2:// format
  return `r2://${r2Key}`;
}
```

### Common Issues

1. **Clock Skew**: Ensure system time is synchronized
2. **Key Rotation**: Update credentials when R2 keys are rotated
3. **Network Failures**: JWKS fetch failures should not break URL generation
4. **Encoding Issues**: Properly encode file names with special characters

## Performance Optimization

### Caching Strategy

- **Generate on-demand**: Don't pre-generate or cache signed URLs
- **Cache R2 credentials**: Avoid repeated environment variable lookups
- **Batch processing**: Generate multiple URLs in parallel when possible

### Monitoring

Track key metrics:

- **URL generation success rate**
- **Average generation time**
- **JWKS fetch failures**
- **Fallback usage rate**

## Testing

### Unit Tests

```typescript
describe("R2PreSignedUrlGenerator", () => {
  it("should generate valid pre-signed URLs", async () => {
    const generator = new R2PreSignedUrlGenerator(
      "test-access-key",
      "test-secret-key",
      "https://test-domain.com"
    );

    const url = await generator.generatePresignedUrl(
      "test-bucket",
      "test/file.jpg"
    );
    expect(url).toMatch(/^https:\/\/test-domain\.com\/test\/file\.jpg\?/);
    expect(url).toContain("X-Amz-Signature=");
  });
});
```

### Integration Tests

```bash
# Test actual URL generation and access
curl -I "$(generate_signed_url)" # Should return 200 OK
```

## Production Deployment Checklist

- [ ] R2 access credentials configured as Cloudflare Workers secrets
- [ ] Custom domain set up and DNS configured
- [ ] SSL/TLS certificate provisioned
- [ ] Error handling and fallbacks implemented
- [ ] Monitoring and alerting configured
- [ ] Security review completed
- [ ] Performance testing completed

## Related Documentation

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS Signature Version 4](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html)
- [Service Standard v1 Specification](../../readme.md)

---

_Last Updated: September 2025_
_Production Deployment: ✅ Live at podcast-service.sesamy-dev.workers.dev_
