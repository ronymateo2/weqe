"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DropEye, DropTypeRecord } from "@/types/domain";

export type SaveDropInput = {
  id: string;
  loggedAt: string;
  name: string;
  quantity: number;
  eye: DropEye;
  notes?: string;
};

type SaveDropTypeInput = {
  name: string;
};

function normalizeDropTypeName(name: string) {
  return name.trim().toLowerCase();
}

async function upsertDropType(userId: string, name: string) {
  const supabase = getSupabaseAdmin();
  const { data: dropType, error: dropTypeError } = await supabase
    .from("dy_drop_types")
    .upsert(
      {
        user_id: userId,
        name
      },
      {
        onConflict: "user_id,name",
        ignoreDuplicates: false
      }
    )
    .select("id, name")
    .single();

  if (dropTypeError || !dropType) {
    throw dropTypeError ?? new Error("No se pudo crear el tipo de gota.");
  }

  return {
    id: dropType.id,
    name: dropType.name
  } as DropTypeRecord;
}

export async function getDropTypesAction() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para ver tus gotas.",
      dropTypes: [] as DropTypeRecord[]
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dy_drop_types")
      .select("id, name")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    return {
      ok: true,
      message: "Tipos de gota cargados.",
      dropTypes: (data ?? []).map((item) => ({
        id: item.id,
        name: item.name
      }))
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudieron cargar los tipos de gota.",
      dropTypes: [] as DropTypeRecord[]
    };
  }
}

export async function saveDropTypeAction(input: SaveDropTypeInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para guardar tipos de gota.",
      dropType: null as DropTypeRecord | null
    };
  }

  const normalizedName = normalizeDropTypeName(input.name);

  if (!normalizedName) {
    return {
      ok: false,
      message: "Escribe el nombre de la gota.",
      dropType: null as DropTypeRecord | null
    };
  }

  if (normalizedName.length > 100) {
    return {
      ok: false,
      message: "El nombre de la gota no puede superar 100 caracteres.",
      dropType: null as DropTypeRecord | null
    };
  }

  try {
    const dropType = await upsertDropType(session.user.id, normalizedName);

    revalidatePath("/drop-types");
    revalidatePath("/register");
    revalidatePath("/history");

    return {
      ok: true,
      message: "Tipo de gota guardado.",
      dropType
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el tipo de gota.",
      dropType: null as DropTypeRecord | null
    };
  }
}

export async function saveDropAction(input: SaveDropInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar gotas." };
  }

  try {
    const normalizedName = normalizeDropTypeName(input.name);

    if (!normalizedName) {
      return { ok: false, message: "Escribe el nombre de la gota." };
    }

    const dropType = await upsertDropType(session.user.id, normalizedName);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("dy_drops").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        drop_type_id: dropType.id,
        logged_at: input.loggedAt,
        quantity: input.quantity,
        eye: input.eye,
        notes: input.notes ?? null
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }

    revalidatePath("/history");
    revalidatePath("/register");
    revalidatePath("/drop-types");

    return { ok: true, message: "Gota registrada.", dropType };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar la gota."
    };
  }
}
