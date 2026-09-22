import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

function getClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

app.get("/make-server-f2a0f7d1/health", (c) => c.json({ status: "ok" }));

// ─── EVENTOS ───
app.get("/make-server-f2a0f7d1/eventos", async (c) => {
  const { data, error } = await getClient().from("eventos").select("*").order("fecha", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/make-server-f2a0f7d1/eventos", async (c) => {
  const body = await c.req.json();
  const { data, error } = await getClient().from("eventos").insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put("/make-server-f2a0f7d1/eventos/:id", async (c) => {
  const { data, error } = await getClient().from("eventos").update(await c.req.json()).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.delete("/make-server-f2a0f7d1/eventos/:id", async (c) => {
  const { error } = await getClient().from("eventos").delete().eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// ─── PAGOS ───
app.get("/make-server-f2a0f7d1/pagos", async (c) => {
  const { data, error } = await getClient().from("pagos").select("*").order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/make-server-f2a0f7d1/pagos", async (c) => {
  const body = await c.req.json();
  const { data, error } = await getClient().from("pagos").insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put("/make-server-f2a0f7d1/pagos/:id", async (c) => {
  const { data, error } = await getClient().from("pagos").update(await c.req.json()).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// ─── MARCOS ───
app.get("/make-server-f2a0f7d1/marcos", async (c) => {
  const { data, error } = await getClient().from("marcos").select("*").order("id");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/make-server-f2a0f7d1/marcos", async (c) => {
  const body = await c.req.json();
  const { data, error } = await getClient().from("marcos").insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put("/make-server-f2a0f7d1/marcos/:id", async (c) => {
  const { data, error } = await getClient().from("marcos").update(await c.req.json()).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

Deno.serve(app.fetch);
