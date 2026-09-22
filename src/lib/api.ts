import { projectId } from "../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-f2a0f7d1`;

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  eventos: {
    list: () => req("/eventos"),
    create: (data: any) => req("/eventos", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => req(`/eventos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => req(`/eventos/${id}`, { method: "DELETE" }),
  },

  pagos: {
    list: () => req("/pagos"),
    create: (data: any) => req("/pagos", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => req(`/pagos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  marcos: {
    list: () => req("/marcos"),
    create: (data: any) => req("/marcos", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => req(`/marcos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
};
