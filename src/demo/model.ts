import { z } from "zod";
export const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Converted",
  "Lost",
] as const;
export const stages = [
  "New Opportunity",
  "Discovery",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export const priorities = ["Low", "Medium", "High"] as const;
export const roles = [
  "Administrator",
  "Sales Manager",
  "Sales Agent",
  "Viewer",
] as const;
export type Role = (typeof roles)[number];
export const sources = [
  "Website",
  "Referral",
  "Campaign",
  "Cold call",
  "Event",
] as const;
export const collections = [
  "leads",
  "contacts",
  "companies",
  "deals",
  "tasks",
  "team",
  "events",
  "rules",
] as const;
export type Collection = (typeof collections)[number];
// A common record envelope keeps the shared CRUD editor simple. Collection-specific fields are validated below.
export const recordSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  email: z.string(),
  phone: z.string(),
  companyId: z.string(),
  ownerId: z.string(),
  status: z.string(),
  source: z.string(),
  priority: z.enum(priorities),
  value: z.number().nonnegative(),
  date: z.string(),
  createdAt: z.string(),
  notes: z.string(),
  tags: z.string(),
  industry: z.string(),
  website: z.string(),
  location: z.string(),
  size: z.string(),
  probability: z.number().min(0).max(100),
  relatedId: z.string(),
  enabled: z.boolean(),
});
export type RecordItem = z.infer<typeof recordSchema>;
export const activitySchema = z.object({
  id: z.string(),
  message: z.string(),
  date: z.string(),
  recordId: z.string(),
});
export const notificationSchema = activitySchema.extend({ read: z.boolean() });
export const stateSchema = z.object({
  version: z.literal(1),
  leads: z.array(recordSchema),
  contacts: z.array(recordSchema),
  companies: z.array(recordSchema),
  deals: z.array(recordSchema),
  tasks: z.array(recordSchema),
  team: z.array(recordSchema),
  events: z.array(recordSchema),
  rules: z.array(recordSchema),
  activities: z.array(activitySchema),
  notifications: z.array(notificationSchema),
});
export type DemoState = z.infer<typeof stateSchema>;
export function day(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function blank(id = "", name = ""): RecordItem {
  return {
    id,
    name,
    email: "",
    phone: "",
    companyId: "",
    ownerId: "",
    status: "",
    source: "",
    priority: "Medium",
    value: 0,
    date: day(),
    createdAt: day(),
    notes: "",
    tags: "",
    industry: "",
    website: "",
    location: "",
    size: "",
    probability: 30,
    relatedId: "",
    enabled: true,
  };
}
export function validate(collection: Collection, row: RecordItem) {
  recordSchema.parse(row);
  if (row.email) z.email().parse(row.email);
  if (
    ["leads", "deals", "tasks", "events"].includes(collection) &&
    !/^\d{4}-\d{2}-\d{2}$/.test(row.date)
  )
    throw Error("Choose a valid date");
  if (collection === "leads" && !leadStatuses.some((s) => s === row.status))
    throw Error("Choose a lead status");
  if (collection === "deals" && !stages.some((s) => s === row.status))
    throw Error("Choose a deal stage");
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
