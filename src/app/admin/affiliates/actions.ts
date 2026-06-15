"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleAffiliate(id: string, status: string) {
  const supabase = createClient();
  await supabase.from("affiliates").update({ status }).eq("id", id);
  revalidatePath("/admin/affiliates");
}
