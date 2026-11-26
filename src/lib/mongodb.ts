import "server-only";

import { MongoClient, ServerApiVersion } from "mongodb";

const globalMongo = globalThis as typeof globalThis & {
  leadflowMongo?: Promise<MongoClient>;
};

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!globalMongo.leadflowMongo) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 10000,
    });

    globalMongo.leadflowMongo = client
      .connect()
      .catch(async (error: unknown) => {
        delete globalMongo.leadflowMongo;

        await client.close().catch(() => {});

        throw error;
      });
  }

  return globalMongo.leadflowMongo;
}
