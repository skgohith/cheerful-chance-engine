import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type CloudClient = SupabaseClient<Database>;

function createPublicClient(): CloudClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Cloud backend is not configured");

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if ((key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export async function listPublicGiveaways() {
  const { data, error } = await createPublicClient().from("giveaways_public").select("*").order("end_date", { ascending: true });
  if (error) throw new Error("Unable to load giveaways");
  return data ?? [];
}

export async function getPublicGiveaway(id: string) {
  const { data, error } = await createPublicClient().from("giveaways_public").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load giveaway");
  return data;
}

export async function listPublicWinners(giveawayId?: string) {
  let query = createPublicClient().from("winners_public").select("*").order("rank");
  if (giveawayId) query = query.eq("giveaway_id", giveawayId);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load winners");
  return data ?? [];
}

export async function submitEntry(data: {
  giveawayId: string;
  fullName: string;
  instagramUsername: string;
  instagramLink: string;
  email?: string | undefined;
  phone?: string | undefined;
  honeypot?: string | undefined;
}, ipHash: string | null) {
  const rpcArgs = {
    p_giveaway_id: data.giveawayId,
    p_full_name: data.fullName,
    p_instagram_username: data.instagramUsername,
    p_instagram_username_normalized: data.instagramUsername.toLowerCase().trim().replace(/^@/, ""),
    p_instagram_link: data.instagramLink,
    ...(data.email ? { p_email: data.email } : {}),
    ...(data.phone ? { p_phone: data.phone } : {}),
    ...(ipHash ? { p_ip_hash: ipHash } : {}),
    p_honeypot: data.honeypot || "",
  };
  const { data: participantId, error } = await createPublicClient().rpc("submit_participant", rpcArgs);
  if (error) {
    const message = error.message;
    if (message.includes("already entered")) return { ok: false as const, error: "This Instagram account has already entered." };
    if (message.includes("no longer accepting")) return { ok: false as const, error: "This giveaway is no longer accepting entries." };
    if (message.includes("Too many attempts")) return { ok: false as const, error: "Too many attempts. Please try again later." };
    return { ok: false as const, error: message.includes("valid") ? message : "We couldn't process that entry. Please try again." };
  }
  return { ok: true as const, participantId };
}

async function assertAdmin(client: CloudClient, userId: string) {
  const { data: userData, error: userError } = await client.auth.getUser();
  const email = userData.user?.email?.toLowerCase();
  if (userError || email !== "germanbro40@gmail.com") throw new Error("Admin access required");
  const { data, error } = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Admin access required");
}

export async function adminListGiveaways(client: CloudClient, userId: string) {
  await assertAdmin(client, userId);
  const { data, error } = await client.from("giveaways").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load admin giveaways");
  return data ?? [];
}

export async function adminListParticipants(client: CloudClient, userId: string, giveawayId: string) {
  await assertAdmin(client, userId);
  const { data, error } = await client.from("participants").select("id, full_name, instagram_username, instagram_link, email, phone, created_at").eq("giveaway_id", giveawayId).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load participants");
  return data ?? [];
}

export async function adminUpdateParticipantInstagramLink(client: CloudClient, userId: string, data: {
  participantId: string;
  giveawayId: string;
  instagramLink: string;
}) {
  await assertAdmin(client, userId);
  const { data: updated, error } = await client.from("participants").update({ instagram_link: data.instagramLink.trim() }).eq("id", data.participantId).eq("giveaway_id", data.giveawayId).select("id, full_name, instagram_username, instagram_link, email, phone, created_at").single();
  if (error || !updated) throw new Error("Unable to update Instagram link");
  return updated;
}

export async function adminListWinners(client: CloudClient, userId: string, giveawayId: string) {
  await assertAdmin(client, userId);
  const { data, error } = await client.from("winners").select("id, full_name, instagram_username, instagram_link, rank, selected_at").eq("giveaway_id", giveawayId).order("rank");
  if (error) throw new Error("Unable to load winners");
  return data ?? [];
}

export async function adminSaveGiveaway(client: CloudClient, userId: string, data: {
  id?: string | undefined;
  title: string;
  description: string;
  imageUrl?: string | undefined;
  instagramUrl?: string | undefined;
  telegramUrl?: string | undefined;
  youtubeUrl?: string | undefined;
  facebookUrl?: string | undefined;
  startDate: string;
  endDate: string;
  winnerLimit: number;
}) {
  await assertAdmin(client, userId);
  const values = {
    title: data.title,
    description: data.description,
    image_url: data.imageUrl || null,
    instagram_url: data.instagramUrl || null,
    telegram_url: data.telegramUrl || null,
    youtube_url: data.youtubeUrl || null,
    facebook_url: data.facebookUrl || null,
    start_date: data.startDate,
    end_date: data.endDate,
    winner_limit: data.winnerLimit,
  };
  if (data.id) {
    const { data: existing, error: readError } = await client.from("giveaways").select("status").eq("id", data.id).single();
    if (readError) throw new Error("Giveaway not found");
    if (existing.status === "completed" || existing.status === "data_cleared") throw new Error("Completed giveaways are locked");
    const { data: updated, error } = await client.from("giveaways").update(values).eq("id", data.id).select().single();
    if (error) throw new Error("Unable to update giveaway");
    return updated;
  }
  const { data: created, error } = await client.from("giveaways").insert(values).select().single();
  if (error) throw new Error("Unable to create giveaway");
  return created;
}

export async function adminDeleteGiveaway(client: CloudClient, userId: string, giveawayId: string) {
  await assertAdmin(client, userId);
  const { data, error } = await client.rpc("delete_giveaway_preserve_winners", { p_giveaway_id: giveawayId });
  if (error || !data) throw new Error(error?.message.includes("not found") ? "Giveaway not found" : "Unable to delete giveaway");
  return { ok: true };
}

export async function adminPickWinners(client: CloudClient, userId: string, giveawayId: string) {
  await assertAdmin(client, userId);
  const { data, error } = await client.rpc("pick_giveaway_winners", { p_giveaway_id: giveawayId });
  if (error) throw new Error(error.message.includes("Not enough") ? "There are not enough entries to fill every winner spot." : "Unable to pick winners");
  return data ?? [];
}

export async function adminClearData(client: CloudClient, userId: string, giveawayId: string) {
  await assertAdmin(client, userId);
  const { data: existing, error: readError } = await client.from("giveaways").select("status").eq("id", giveawayId).single();
  if (readError) throw new Error("Giveaway not found");
  if (existing.status !== "completed") throw new Error("Only completed giveaways can be cleared");
  const { error: deleteError } = await client.from("participants").delete().eq("giveaway_id", giveawayId);
  if (deleteError) throw new Error("Unable to clear participant data");
  const { error: updateError } = await client.from("giveaways").update({ status: "data_cleared" }).eq("id", giveawayId);
  if (updateError) throw new Error("Unable to update giveaway status");
  return { ok: true };
}