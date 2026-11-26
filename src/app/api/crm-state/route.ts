import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { getMongoClient } from "@/lib/mongodb";
import { stateSchema, type DemoState } from "@/demo/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSPACE = "default";
const MAX_BYTES = 4 * 1024 * 1024;
type Workspace = {
  _id: string;
  revision: number;
  state: DemoState;
  updatedAt: Date;
};
const writeSchema = z.object({
  revision: z.number().int().nonnegative(),
  state: stateSchema,
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Local demo only. Host/origin checks are defense in depth, NOT authentication.
function localRequest(request: Request, write = false) {
  if (process.env.LEADFLOW_LOCAL_ATLAS !== "1") return false;
  const host = request.headers.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  return !write || request.headers.get("origin") === `http://${host}`;
}

async function workspaces() {
  const client = await getMongoClient();
  return client
    .db(process.env.MONGODB_DB || "leadflow_ai")
    .collection<Workspace>("crm_workspaces");
}

function unavailable(error: unknown) {
  // Do not expose credentials or driver connection strings to the browser.
  console.error(
    "LeadFlow Atlas request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error:
        "Atlas request failed. Check database credentials, network access and server logs.",
    },
    503,
  );
}

export async function GET(request: Request) {
  if (!localRequest(request))
    return json(
      { error: "Local Atlas demo is disabled or host is not permitted." },
      403,
    );
  try {
    const collection = await workspaces();
    const doc = await collection.findOne({ _id: WORKSPACE });
    if (!doc) return json({ revision: 0, state: null });
    return json({
      revision: doc.revision,
      state: stateSchema.parse(doc.state),
    });
  } catch (error) {
    return unavailable(error);
  }
}

export async function PUT(request: Request) {
  if (!localRequest(request, true))
    return json(
      { error: "Local Atlas demo is disabled or origin is not permitted." },
      403,
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return json({ error: "JSON required." }, 415);
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    return json({ error: "Workspace exceeds the demo size limit." }, 413);
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BYTES)
      return json({ error: "Workspace exceeds the demo size limit." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid workspace data." }, 400);
  const { revision, state } = parsed.data;
  try {
    const collection = await workspaces();
    if (revision === 0) {
      try {
        await collection.insertOne({
          _id: WORKSPACE,
          revision: 1,
          state,
          updatedAt: new Date(),
        });
        return json({ revision: 1 });
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000)
          return json(
            { error: "Workspace already exists. Reload before saving." },
            409,
          );
        throw error;
      }
    }
    const result = await collection.updateOne(
      { _id: WORKSPACE, revision },
      { $set: { state, updatedAt: new Date() }, $inc: { revision: 1 } },
    );
    if (result.matchedCount !== 1)
      return json(
        {
          error:
            "Workspace has changed. Export pending changes before reloading.",
        },
        409,
      );
    return json({ revision: revision + 1 });
  } catch (error) {
    return unavailable(error);
  }
}
