import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPublicGiveaways = createServerFn({ method: "GET" }).handler(async () => {
  const { listPublicGiveaways: load } = await import("./giveaway.server");
  return load();
});

export const getPublicGiveaway = createServerFn({ method: "GET" }).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data }) => {
  const { getPublicGiveaway: load } = await import("./giveaway.server");
  return load(data.id);
});

export const listPublicWinners = createServerFn({ method: "GET" }).inputValidator((input) => z.object({ giveawayId: z.string().uuid().optional() }).parse(input ?? {})).handler(async ({ data }) => {
  const { listPublicWinners: load } = await import("./giveaway.server");
  return load(data.giveawayId);
});

export const submitGiveawayEntry = createServerFn({ method: "POST" }).inputValidator((input) => z.object({
  giveawayId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  instagramUsername: z.string().trim().min(2).max(120),
  instagramLink: z.string().trim().url().max(300),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  honeypot: z.string().max(100).optional(),
}).parse(input)).handler(async ({ data }) => {
  const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? null;
  const firstIp = ip?.split(",")[0]?.trim() ?? null;
  const ipHash = firstIp ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(firstIp)))).map((byte) => byte.toString(16).padStart(2, "0")).join("") : null;
  const { submitEntry } = await import("./giveaway.server");
  return submitEntry({
    giveawayId: data.giveawayId,
    fullName: data.fullName,
    instagramUsername: data.instagramUsername,
    instagramLink: data.instagramLink,
    email: data.email,
    phone: data.phone,
    honeypot: data.honeypot,
  }, ipHash);
});

export const adminListGiveaways = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { adminListGiveaways: load } = await import("./giveaway.server");
  return load(context.supabase, context.userId);
});

export const adminListParticipants = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ giveawayId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { adminListParticipants: load } = await import("./giveaway.server");
  return load(context.supabase, context.userId, data.giveawayId);
});

export const adminUpdateParticipantInstagramLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  participantId: z.string().uuid(),
  giveawayId: z.string().uuid(),
  instagramLink: z.string().trim().url().max(300),
}).parse(input)).handler(async ({ data, context }) => {
  const { adminUpdateParticipantInstagramLink: update } = await import("./giveaway.server");
  return update(context.supabase, context.userId, data);
});

export const adminListWinners = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ giveawayId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { adminListWinners: load } = await import("./giveaway.server");
  return load(context.supabase, context.userId, data.giveawayId);
});

const giveawayInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(1000),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  winnerLimit: z.number().int().min(1).max(10),
}).refine((value) => new Date(value.endDate) > new Date(value.startDate), { message: "End date must be after start date" });

export const adminSaveGiveaway = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => giveawayInput.parse(input)).handler(async ({ data, context }) => {
  const { adminSaveGiveaway: save } = await import("./giveaway.server");
  return save(context.supabase, context.userId, {
    id: data.id,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    startDate: data.startDate,
    endDate: data.endDate,
    winnerLimit: data.winnerLimit,
  });
});

export const adminDeleteGiveaway = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ giveawayId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { adminDeleteGiveaway: remove } = await import("./giveaway.server");
  return remove(context.supabase, context.userId, data.giveawayId);
});

export const adminPickWinners = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ giveawayId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { adminPickWinners: pick } = await import("./giveaway.server");
  return pick(context.supabase, context.userId, data.giveawayId);
});

export const adminClearData = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ giveawayId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { adminClearData: clear } = await import("./giveaway.server");
  return clear(context.supabase, context.userId, data.giveawayId);
});