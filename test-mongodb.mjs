import { loadEnvFile } from "node:process";
import { MongoClient } from "mongodb";

// Load environment variables
try {
  loadEnvFile(".env.local");
} catch {
  console.error("ERROR: .env.local file could not be loaded.");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "leadflow_ai";

if (!uri) {
  console.error("ERROR: MONGODB_URI is missing.");
  process.exit(1);
}

console.log("============================");
console.log("LeadFlow AI MongoDB Test");
console.log("============================");

console.log("Environment: LOADED");
console.log("Database:", dbName);

let client;

try {
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log("Connecting to MongoDB Atlas...");

  await client.connect();

  console.log("SUCCESS: Connected to MongoDB Atlas!");

  await client.db(dbName).command({ ping: 1 });

  console.log("SUCCESS: Database ping passed!");

  const workspace = await client
    .db(dbName)
    .collection("crm_workspaces")
    .findOne({ _id: "default" });

  console.log("SUCCESS: Database query passed!");

  console.log("Workspace exists:", workspace ? "YES" : "NO");

  console.log("============================");
  console.log("ALL DATABASE CHECKS PASSED");
  console.log("============================");
} catch (error) {
  console.error("DATABASE CONNECTION FAILED");
  console.error("Error name:", error.name);
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);

  process.exitCode = 1;
} finally {
  if (client) {
    await client.close();
  }
}
