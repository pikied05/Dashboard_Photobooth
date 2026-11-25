import { supabase } from "../../utils/supabase/client";

// Todo va directo a Supabase con la sesión del usuario (sin Edge Function).
// Las políticas RLS de cada tabla deciden qué puede leer o escribir.

const BUCKET_FRAMES = "frames";

type Respuesta = { data: any; error: { message: string } | null };

function ok(res: Respuesta) {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function urlFrame(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET_FRAMES).getPublicUrl(path).data.publicUrl;
}

function slug(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "marco"
  );
}

// frames (tabla de Unity) → forma que usa el dashboard
function frameAMarco(f: any, usos = 0) {
  return { ...f, usos, imagen_url: urlFrame(f.archivo_path) };
}

// sesiones (tabla de Unity) → forma que usa el panel de pagos
function sesionAPago(s: any) {
  return {
    id: s.id,
    ref: String(s.id).slice(0, 6).toUpperCase(),
    invitado: s.paquete_id ?? "Sesión",
    email: [s.frame_id, s.filtro].filter(Boolean).join(" · "),
    fotos: s.num_fotos ?? 0,
    monto: s.monto ?? 0,
    estado: s.pagada ? "Pagado" : "Pendiente",
    fecha: s.creada_en ? new Date(s.creada_en).toLocaleDateString("es-MX") : "",
  };
}

export const api = {
  eventos: {
    list: async () =>
      ok(await supabase.from("eventos").select("*").order("fecha", { ascending: true })),
    create: async (data: any) =>
      ok(await supabase.from("eventos").insert(data).select().single()),
    update: async (id: number, data: any) =>
      ok(await supabase.from("eventos").update(data).eq("id", id).select().single()),
    delete: async (id: number) => {
      ok(await supabase.from("eventos").delete().eq("id", id));
      return { ok: true };
    },
  },

  // "Marcos" del dashboard = tabla frames
  marcos: {
    list: async () => {
      const frames: any[] = ok(
        await supabase.from("frames").select("*").order("orden", { ascending: true })
      );
      return Promise.all(
        frames.map(async (f) => {
          const { count } = await supabase
            .from("sesiones")
            .select("id", { count: "exact", head: true })
            .eq("frame_id", f.id);
          return frameAMarco(f, count ?? 0);
        })
      );
    },

    create: async (d: {
      nombre: string;
      archivo_path?: string;
      ancho_px?: number;
      alto_px?: number;
      fotos_compatibles?: number[];
      slots?: any[];
      activo?: boolean;
    }) => {
      const { data: ultimo } = await supabase
        .from("frames")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1);
      const orden = (ultimo?.[0]?.orden ?? 0) + 1;

      const fila = ok(
        await supabase
          .from("frames")
          .insert({
            id: `${slug(d.nombre)}_${Date.now().toString(36)}`,
            nombre: d.nombre,
            archivo_path: d.archivo_path ?? null,
            ancho_px: d.ancho_px ?? null,
            alto_px: d.alto_px ?? null,
            fotos_compatibles: d.fotos_compatibles ?? [2, 3, 4],
            slots: d.slots ?? [],
            activo: d.activo ?? true,
            orden,
          })
          .select()
          .single()
      );
      return frameAMarco(fila, 0);
    },

    update: async (id: string, data: { activo?: boolean; nombre?: string }) => {
      const cambios: any = { actualizado_en: new Date().toISOString() };
      if (typeof data.activo === "boolean") cambios.activo = data.activo;
      if (data.nombre) cambios.nombre = data.nombre;
      ok(await supabase.from("frames").update(cambios).eq("id", id).select().single());
      return { ok: true };
    },
  },

  // "Pagos" del dashboard = tabla sesiones (las crea la cabina)
  pagos: {
    list: async () => {
      const filas: any[] = ok(
        await supabase
          .from("sesiones")
          .select("*")
          .order("creada_en", { ascending: false })
          .limit(1000)
      );
      return filas.map(sesionAPago);
    },
    update: async (id: string, data: { estado: string }) => {
      ok(
        await supabase
          .from("sesiones")
          .update({ pagada: data.estado === "Pagado" })
          .eq("id", id)
          .select()
          .single()
      );
      return { ok: true };
    },
  },

  // Modo evento = la cabina no cobra (cabinas.modo_cobro_activo = false)
  cabinas: {
    modo: async (): Promise<"cabina" | "evento"> => {
      const filas: any[] = ok(await supabase.from("cabinas").select("id, modo_cobro_activo"));
      if (!filas.length) return "cabina";
      return filas.every((c) => c.modo_cobro_activo) ? "cabina" : "evento";
    },
    setModo: async (modo: "cabina" | "evento") => {
      const filas: any[] = ok(
        await supabase
          .from("cabinas")
          .update({ modo_cobro_activo: modo === "cabina" })
          .neq("id", "")
          .select("id")
      );
      if (!filas.length) throw new Error("No se actualizó ninguna cabina (¿permisos?)");
    },
  },
};