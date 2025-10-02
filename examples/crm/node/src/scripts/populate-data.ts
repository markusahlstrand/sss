#!/usr/bin/env tsx

import { readFileSync } from "fs";
import { join } from "path";
import { Database, getDatabase } from "../lib/database";
import { VendorRepository } from "../repositories/vendor";
import { UserRepository } from "../repositories/user";
import { ProductRepository } from "../repositories/product";
import { PurchaseOptionRepository } from "../repositories/purchase-option";
import { ContractRepository } from "../repositories/contract";
import { EntitlementRepository } from "../repositories/entitlement";

interface CSVRow {
  vendorId: string;
  userId: string;
  nEntitlements: number;
  sesamy_vendor: boolean;
  portalLink: string;
  email: string;
  deletedAt: string;
  linkedWIthId: string;
  user_not_found: boolean;
}

// Sample vendor names and product types for realistic data
const VENDOR_NAMES = [
  "Sesamy Media",
  "Digital Publishing Co",
  "Content Creator Studio",
  "Media House Pro",
  "Podcast Network Plus",
  "Independent Publishers",
  "Creative Content Labs",
  "Digital Magazine Hub",
  "Audio Content Studio",
  "Subscription Media Co"
];

const PRODUCT_TYPES = ["pass", "article", "podcast", "bundle"] as const;

const PRODUCT_DESCRIPTIONS = {
  pass: "Premium access pass for exclusive content",
  article: "High-quality digital article with premium insights",
  podcast: "Professional podcast series with expert interviews",
  bundle: "Curated bundle of premium content across multiple formats"
};

function parseCsvFile(filePath: string): CSVRow[] {
  const csvContent = readFileSync(filePath, "utf-8");
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map(line => {
    const values = line.split(",");
    return {
      vendorId: values[0],
      userId: values[1],
      nEntitlements: parseInt(values[2]) || 0,
      sesamy_vendor: values[3] === "True",
      portalLink: values[4],
      email: values[5],
      deletedAt: values[6],
      linkedWIthId: values[7],
      user_not_found: values[8] === "True"
    };
  });
}

function generateVendorName(vendorId: string): string {
  // Use a hash-like approach to consistently generate names
  const hash = vendorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseIndex = hash % VENDOR_NAMES.length;
  
  // Add some variation based on vendor ID
  if (vendorId.includes('-')) {
    return VENDOR_NAMES[baseIndex];
  } else if (vendorId.length > 20) {
    return `${VENDOR_NAMES[baseIndex]} Enterprise`;
  } else {
    return `${VENDOR_NAMES[baseIndex]} Studio`;
  }
}

function generateProductName(productId: string, type: string): string {
  const prefixes = {
    pass: "Premium Pass",
    article: "Exclusive Article",
    podcast: "Professional Podcast",
    bundle: "Content Bundle"
  };
  
  return `${prefixes[type as keyof typeof prefixes]} ${productId.slice(0, 8)}`;
}

async function populateDatabase() {
  console.log("🚀 Starting data population from CSV files...");
  
  const db = getDatabase();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Initialize repositories
  const vendorRepo = new VendorRepository(db);
  const userRepo = new UserRepository(db);
  const productRepo = new ProductRepository(db);
  const purchaseOptionRepo = new PurchaseOptionRepository(db);
  const contractRepo = new ContractRepository(db);
  const entitlementRepo = new EntitlementRepository(db);

  // Read CSV data
  const csvPath = join(__dirname, "../data/entitlements_count_by_vendor_user_with_email.csv");
  console.log(`📖 Reading CSV file: ${csvPath}`);
  
  const csvData = parseCsvFile(csvPath);
  console.log(`✅ Parsed ${csvData.length} rows from CSV`);

  // Extract unique vendors and users
  const uniqueVendors = new Map<string, CSVRow>();
  const uniqueUsers = new Map<string, CSVRow>();
  
  csvData.forEach(row => {
    if (!uniqueVendors.has(row.vendorId)) {
      uniqueVendors.set(row.vendorId, row);
    }
    
    const userKey = `${row.vendorId}:${row.userId}`;
    if (!uniqueUsers.has(userKey) && row.email && !row.user_not_found) {
      uniqueUsers.set(userKey, row);
    }
  });

  console.log(`📊 Found ${uniqueVendors.size} unique vendors`);
  console.log(`📊 Found ${uniqueUsers.size} unique users`);

  // Create vendors
  console.log("\n👥 Creating vendors...");
  let vendorCount = 0;
  for (const [vendorId, data] of uniqueVendors) {
    try {
      const existingVendor = await vendorRepo.findById(vendorId);
      if (!existingVendor) {
        await vendorRepo.create({
          vendorId,
          name: generateVendorName(vendorId),
          metadata: {
            sesamyVendor: data.sesamy_vendor,
            portalLink: data.portalLink,
            importedAt: new Date().toISOString()
          }
        });
        vendorCount++;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to create vendor ${vendorId}: ${error}`);
    }
    
    if (vendorCount % 100 === 0 && vendorCount > 0) {
      console.log(`   Created ${vendorCount} vendors...`);
    }
  }
  console.log(`✅ Created ${vendorCount} vendors`);

  // Create users
  console.log("\n👤 Creating users...");
  let userCount = 0;
  for (const [userKey, data] of uniqueUsers) {
    try {
      const existingUser = await userRepo.findById(data.vendorId, data.userId);
      if (!existingUser && data.email) {
        await userRepo.create(data.vendorId, {
          userId: data.userId,
          email: data.email,
          profile: {
            importedAt: new Date().toISOString(),
            entitlementsCount: data.nEntitlements,
            linkedWithId: data.linkedWIthId || null
          }
        });
        userCount++;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to create user ${data.vendorId}:${data.userId}: ${error}`);
    }
    
    if (userCount % 100 === 0 && userCount > 0) {
      console.log(`   Created ${userCount} users...`);
    }
  }
  console.log(`✅ Created ${userCount} users`);

  // Create products for each vendor
  console.log("\n📦 Creating products...");
  let productCount = 0;
  for (const vendorId of uniqueVendors.keys()) {
    // Create 2-5 products per vendor
    const numProducts = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < numProducts; i++) {
      const productType = PRODUCT_TYPES[Math.floor(Math.random() * PRODUCT_TYPES.length)];
      const productId = `${productType}-${vendorId.slice(0, 8)}-${i + 1}`;
      
      try {
        const existingProduct = await productRepo.findById(vendorId, productId);
        if (!existingProduct) {
          await productRepo.create(vendorId, {
            productId,
            name: generateProductName(productId, productType),
            description: PRODUCT_DESCRIPTIONS[productType],
            type: productType
          });
          productCount++;
        }
      } catch (error) {
        console.warn(`⚠️  Failed to create product ${vendorId}:${productId}: ${error}`);
      }
    }
    
    if (productCount % 50 === 0 && productCount > 0) {
      console.log(`   Created ${productCount} products...`);
    }
  }
  console.log(`✅ Created ${productCount} products`);

  // Create purchase options for products
  console.log("\n💰 Creating purchase options...");
  let purchaseOptionCount = 0;
  
  // Get all products to create purchase options for them
  for (const vendorId of uniqueVendors.keys()) {
    try {
      const vendorProducts = await productRepo.listByVendor(vendorId, 100, 0);
      
      for (const product of vendorProducts.data) {
        // Create 1-3 purchase options per product
        const numOptions = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numOptions; i++) {
          const purchaseOptionId = `po-${product.productId}-${i + 1}`;
          const prices = [9.99, 19.99, 29.99, 49.99, 99.99];
          const durations = [30, 90, 180, 365];
          
          try {
            const existing = await purchaseOptionRepo.findById(vendorId, purchaseOptionId);
            if (!existing) {
              await purchaseOptionRepo.create(vendorId, {
                purchaseOptionId,
                productId: product.productId,
                price: prices[Math.floor(Math.random() * prices.length)],
                billingCycle: i === 0 ? "one-time" : i === 1 ? "monthly" : "yearly"
              });
              purchaseOptionCount++;
            }
          } catch (error) {
            console.warn(`⚠️  Failed to create purchase option ${purchaseOptionId}: ${error}`);
          }
        }
      }
      
      if (purchaseOptionCount % 50 === 0 && purchaseOptionCount > 0) {
        console.log(`   Created ${purchaseOptionCount} purchase options...`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process products for vendor ${vendorId}: ${error}`);
    }
  }
  console.log(`✅ Created ${purchaseOptionCount} purchase options`);

  // Create some contracts
  console.log("\n📄 Creating contracts...");
  let contractCount = 0;
  
  for (const vendorId of Array.from(uniqueVendors.keys()).slice(0, 20)) {
    try {
      const vendorProducts = await productRepo.listByVendor(vendorId, 10, 0);
      
      for (const product of vendorProducts.data.slice(0, 2)) {
        const contractId = `contract-${product.productId}`;
        
        try {
          const existing = await contractRepo.findById(vendorId, contractId);
          if (!existing) {
            await contractRepo.create(vendorId, {
              contractId,
              productId: product.productId,
              name: `Contract for ${product.name}`,
              terms: "Standard terms and conditions apply",
              effectiveDate: new Date(),
              expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              status: "active"
            });
            contractCount++;
          }
        } catch (error) {
          console.warn(`⚠️  Failed to create contract ${contractId}: ${error}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process contracts for vendor ${vendorId}: ${error}`);
    }
  }
  console.log(`✅ Created ${contractCount} contracts`);

  console.log("\n🎉 Data population completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - Vendors: ${vendorCount}`);
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Purchase Options: ${purchaseOptionCount}`);
  console.log(`   - Contracts: ${contractCount}`);
  
  process.exit(0);
}

// Run the population script
if (require.main === module) {
  populateDatabase().catch((error) => {
    console.error("❌ Error populating database:", error);
    process.exit(1);
  });
}