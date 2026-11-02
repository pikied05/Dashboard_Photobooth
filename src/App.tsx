import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./lib/api";
import { supabase } from "../utils/supabase/client";

const BUCKET_MARCOS = "marcos";

async function subirImagenMarco(file: File): Promise<string> {
  const extension = file.name.split(".").pop();
  const rutaArchivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_MARCOS).upload(rutaArchivo, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_MARCOS).getPublicUrl(rutaArchivo);
  return data.publicUrl;
}

const NAV_ITEMS = [
  { id: "resumen", label: "Resumen" },
  { id: "marcos", label: "Marcos" },
  { id: "fotobooth", label: "Fotobooth" },
  { id: "pagos", label: "Pagos" },
  { id: "eventos", label: "Eventos" },
];

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatFecha(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
}
function diaSemana(iso: string) {
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return dias[new Date(iso + "T12:00:00").getDay()];
}

export default function App() {
  const [navActivo, setNavActivo] = useState("resumen");
  const [boothActivo, setBoothActivo] = useState(true);
  const [marcos, setMarcos] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [arrastreEncima, setArrastreEncima] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [m, p, e] = await Promise.all([api.marcos.list(), api.pagos.list(), api.eventos.list()]);
      setMarcos(m);
      setPagos(p);
      setEventos(e);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const toggleMarco = async (id: number, activo: boolean) => {
    setMarcos((prev) => prev.map((m) => m.id === id ? { ...m, activo: !activo } : m));
    await api.marcos.update(id, { activo: !activo });
  };

  const totalIngresos = pagos.filter((p) => p.estado === "Pagado").reduce((s, p) => s + Number(p.monto), 0);
  const totalFotos = pagos.reduce((s, p) => s + Number(p.fotos), 0);
  const marcosActivos = marcos.filter((m) => m.activo).length;

  if (cargando) {
    return (
      <div className="flex h-full bg-[#e9e5dc] items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#e9e5dc] text-[#0d0d0d] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-none flex flex-col border-r border-[#0d0d0d]/10 py-8 px-6">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-1">Photo Booth</p>
          <p className="text-lg font-light tracking-wide">Admin</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button key={id} onClick={() => setNavActivo(id)}
              className={`w-full text-left px-0 py-2.5 text-sm transition-all duration-150 border-b border-transparent ${navActivo === id ? "text-[#0d0d0d] font-medium border-b-[#0d0d0d]" : "text-[#0d0d0d]/40 hover:text-[#0d0d0d]/70 font-light"}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={() => setBoothActivo((v) => !v)}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-full text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 ${boothActivo ? "bg-[#0d0d0d] text-[#e9e5dc]" : "bg-[#0d0d0d]/10 text-[#0d0d0d]/50"}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-none ${boothActivo ? "bg-[#e9e5dc]" : "bg-[#0d0d0d]/30"}`} />
            {boothActivo ? "Booth activo" : "Booth inactivo"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="px-12 pt-10 pb-8 flex items-start justify-between">
          <h1 className="text-4xl text-[#0d0d0d]" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            {NAV_ITEMS.find((n) => n.id === navActivo)?.label}
          </h1>
          <p className="text-[7rem] font-bold leading-none select-none text-[#0d0d0d]/[0.06]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {navActivo === "resumen" ? "01" : navActivo === "marcos" ? "02" : navActivo === "fotobooth" ? "03" : navActivo === "pagos" ? "04" : "05"}
          </p>
        </header>
        <div className="mx-12 border-t border-[#0d0d0d]/10 mb-10" />
        <div className="px-12 pb-12">
          {navActivo === "resumen" && <Resumen totalIngresos={totalIngresos} totalFotos={totalFotos} marcosActivos={marcosActivos} boothActivo={boothActivo} setBoothActivo={setBoothActivo} pagos={pagos} marcos={marcos} />}
          {navActivo === "marcos" && <Marcos marcos={marcos} toggleMarco={toggleMarco} arrastreEncima={arrastreEncima} setArrastreEncima={setArrastreEncima} onCrear={async (nombre: string, archivo: File | null) => {
            let imagen_url: string | undefined;
            if (archivo) imagen_url = await subirImagenMarco(archivo);
            const m = await api.marcos.create({ nombre, activo: true, usos: 0, imagen_url });
            setMarcos((prev) => [...prev, m]);
          }} />}
          {navActivo === "fotobooth" && <PanelFotobooth boothActivo={boothActivo} setBoothActivo={setBoothActivo} />}
          {navActivo === "pagos" && <Pagos pagos={pagos} totalIngresos={totalIngresos} eventos={eventos} onActualizar={async (id: number, estado: string) => { await api.pagos.update(id, { estado }); setPagos((prev) => prev.map((p) => p.id === id ? { ...p, estado } : p)); }} />}
          {navActivo === "eventos" && <PanelEventos eventos={eventos} onCrear={async (ev: any) => { const nuevo = await api.eventos.create(ev); setEventos((prev) => [...prev, nuevo]); }} onActualizar={async (id: number, data: any) => { const actualizado = await api.eventos.update(id, data); setEventos((prev) => prev.map((e) => e.id === id ? actualizado : e)); }} onEliminar={async (id: number) => { await api.eventos.delete(id); setEventos((prev) => prev.filter((e) => e.id !== id)); }} />}
        </div>
      </main>
    </div>
  );
}

/* ─── Resumen ─── */
function Resumen({ totalIngresos, totalFotos, marcosActivos, boothActivo, setBoothActivo, pagos, marcos }: any) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#0d0d0d]/10">
        {[
          { etiqueta: "Ingresos Totales", valor: `$${totalIngresos.toLocaleString()}`, sub: "pagado" },
          { etiqueta: "Fotos Tomadas", valor: totalFotos.toString(), sub: "sesión actual" },
          { etiqueta: "Marcos Activos", valor: `${marcosActivos}/${marcos.length}`, sub: "habilitados" },
          { etiqueta: "Estado", valor: boothActivo ? "En línea" : "Apagado", sub: "fotobooth" },
        ].map((s, i) => (
          <div key={i} className="bg-[#e9e5dc] p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-4">{s.etiqueta}</p>
            <p className="text-5xl font-bold text-[#0d0d0d] leading-none mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{s.valor}</p>
            <p className="text-xs text-[#0d0d0d]/40 uppercase tracking-[0.15em]">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-6">Transacciones Recientes</p>
          {pagos.length === 0 ? (
            <p className="text-sm font-light text-[#0d0d0d]/30">Sin transacciones registradas.</p>
          ) : (
            <div className="space-y-0">
              {pagos.slice(0, 5).map((p: any, i: number) => (
                <div key={p.id} className={`flex items-center justify-between py-4 ${i < 4 ? "border-b border-[#0d0d0d]/10" : ""}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[#0d0d0d]/30 w-20">TXN-{String(p.id).padStart(4, "0")}</span>
                    <span className="text-sm font-light">{p.invitado}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium">${p.monto}</span>
                    <InsigniaEstado estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-6">Control del Booth</p>
          <div className={`p-8 transition-all duration-500 ${boothActivo ? "bg-[#0d0d0d]" : "bg-[#0d0d0d]/8"}`} style={{ aspectRatio: "3/4" }}>
            <div className="h-full flex flex-col justify-between">
              <p className={`text-[10px] uppercase tracking-[0.2em] ${boothActivo ? "text-white/40" : "text-[#0d0d0d]/30"}`}>Fotobooth</p>
              <p className={`text-5xl leading-tight ${boothActivo ? "text-white" : "text-[#0d0d0d]/30"}`}
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                {boothActivo ? "En\nVivo" : "En\nPausa"}
              </p>
              <button onClick={() => setBoothActivo((v: boolean) => !v)}
                className={`flex items-center justify-between text-xs uppercase tracking-[0.2em] font-medium transition-colors ${boothActivo ? "text-white/60 hover:text-white" : "text-[#0d0d0d]/40 hover:text-[#0d0d0d]"}`}>
                <span>{boothActivo ? "Desactivar" : "Activar"}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Marcos ─── */
const MAX_MARCO_MB = 10;

function Marcos({ marcos, toggleMarco, arrastreEncima, setArrastreEncima, onCrear }: any) {
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validarYFijarArchivo = (file: File | undefined | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Ese archivo no es una imagen.");
      return;
    }
    if (file.size > MAX_MARCO_MB * 1024 * 1024) {
      setError(`El archivo pesa más de ${MAX_MARCO_MB}MB.`);
      return;
    }
    setArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!nombreNuevo.trim()) {
      setNombreNuevo(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleCrear = async () => {
    if (!nombreNuevo.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await onCrear(nombreNuevo.trim(), archivo);
      setNombreNuevo("");
      setArchivo(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      console.error("Error subiendo marco:", err);
      setError("No se pudo subir el marco. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-10">
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastreEncima(true); }}
        onDragLeave={() => setArrastreEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastreEncima(false);
          validarYFijarArchivo(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border transition-all duration-200 p-16 flex flex-col items-center gap-4 cursor-pointer ${arrastreEncima ? "border-[#0d0d0d] bg-[#0d0d0d]/5" : "border-[#0d0d0d]/20 hover:border-[#0d0d0d]/50"}`}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => validarYFijarArchivo(e.target.files?.[0])}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Vista previa" className="max-h-24 object-contain" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#0d0d0d]/40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
        <div className="text-center">
          <p className="text-sm font-light text-[#0d0d0d]/70">
            {archivo ? archivo.name : "Arrastra un marco aquí o haz clic para elegirlo"}
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#0d0d0d]/30 mt-1">PNG transparente recomendado · máx {MAX_MARCO_MB}MB</p>
        </div>
        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre del marco"
            className="px-4 py-2 bg-transparent border border-[#0d0d0d]/20 text-sm font-light focus:outline-none focus:border-[#0d0d0d]/50 placeholder-[#0d0d0d]/30"
            onKeyDown={(e) => e.key === "Enter" && handleCrear()} />
          <button onClick={handleCrear} disabled={guardando || !nombreNuevo.trim()}
            className="px-6 py-2 bg-[#0d0d0d] text-[#e9e5dc] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#0d0d0d]/80 transition-colors disabled:opacity-40">
            {guardando ? "Subiendo..." : "Agregar"}
          </button>
        </div>
        {error && <p className="text-[10px] uppercase tracking-[0.15em] text-red-500">{error}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40">Marcos instalados ({marcos.length})</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#0d0d0d]/40">{marcos.filter((m: any) => m.activo).length} activos</p>
        </div>
        {marcos.length === 0 ? (
          <p className="text-sm font-light text-[#0d0d0d]/30">Sin marcos. Agrega uno arriba.</p>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-px bg-[#0d0d0d]/10">
            {marcos.map((marco: any) => (
              <div key={marco.id} className={`bg-[#e9e5dc] p-5 flex flex-col gap-4 transition-all duration-200 ${!marco.activo ? "opacity-35" : ""}`}>
                <div className="mx-auto bg-white p-1.5 shadow-sm flex items-center justify-center" style={{ width: 44, height: 64 }}>
                  {marco.imagen_url ? (
                    <img src={marco.imagen_url} alt={marco.nombre} className="max-w-full max-h-full object-contain" />
                  ) : (
                    [...Array(3)].map((_, i) => <div key={i} className="bg-[#d8d4cc] mb-0.5 last:mb-0 w-full" style={{ height: 20 }} />)
                  )}
                </div>
                <div className="text-center">
                  <p className="text-base font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{marco.usos}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mt-0.5">usos</p>
                  <p className="text-[10px] font-light text-[#0d0d0d]/60 mt-1.5 truncate">{marco.nombre}</p>
                </div>
                <button onClick={() => toggleMarco(marco.id, marco.activo)}
                  className={`text-[9px] uppercase tracking-[0.2em] font-medium py-1.5 transition-colors ${marco.activo ? "bg-[#0d0d0d] text-[#e9e5dc]" : "bg-[#0d0d0d]/10 text-[#0d0d0d]/40"}`}>
                  {marco.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Panel Fotobooth ─── */
function PanelFotobooth({ boothActivo, setBoothActivo }: any) {
  const [cuenta, setCuenta] = useState(3);
  const [flash, setFlash] = useState(false);
  const [copias, setCopias] = useState(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#0d0d0d]/10 max-w-3xl">
      <div className={`lg:col-span-1 p-8 flex flex-col justify-between transition-all duration-500 cursor-pointer ${boothActivo ? "bg-[#0d0d0d]" : "bg-[#0d0d0d]/8"}`}
        style={{ minHeight: 360 }} onClick={() => setBoothActivo((v: boolean) => !v)}>
        <p className={`text-[10px] uppercase tracking-[0.2em] ${boothActivo ? "text-white/40" : "text-[#0d0d0d]/30"}`}>Estado</p>
        <div>
          <p className={`text-6xl leading-none mb-2 ${boothActivo ? "text-white" : "text-[#0d0d0d]/20"}`}
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            {boothActivo ? "On" : "Off"}
          </p>
          <p className={`text-xs font-light ${boothActivo ? "text-white/50" : "text-[#0d0d0d]/30"}`}>
            {boothActivo ? "Los invitados pueden tomar fotos" : "Toca para activar"}
          </p>
        </div>
        <span className={`text-lg ${boothActivo ? "text-white/40" : "text-[#0d0d0d]/20"}`}>→</span>
      </div>
      <div className="lg:col-span-2 bg-[#e9e5dc] p-8 space-y-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40">Configuración</p>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-light mb-3">Cuenta regresiva</p>
            <div className="flex gap-2">
              {[3, 5, 10].map((s) => (
                <button key={s} onClick={() => setCuenta(s)}
                  className={`px-5 py-2.5 text-sm font-light transition-colors ${cuenta === s ? "bg-[#0d0d0d] text-[#e9e5dc]" : "bg-[#0d0d0d]/8 text-[#0d0d0d]/60 hover:bg-[#0d0d0d]/15"}`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-4 border-t border-[#0d0d0d]/10">
            <div>
              <p className="text-sm font-light">Efecto flash</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#0d0d0d]/40 mt-0.5">Animación al capturar</p>
            </div>
            <button onClick={() => setFlash((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${flash ? "bg-[#0d0d0d]" : "bg-[#0d0d0d]/15"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-[#e9e5dc] shadow transition-transform duration-200 ${flash ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-4 border-t border-[#0d0d0d]/10">
            <div>
              <p className="text-sm font-light">Copias a imprimir</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#0d0d0d]/40 mt-0.5">Por sesión</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCopias((v) => Math.max(1, v - 1))} className="w-8 h-8 flex items-center justify-center text-[#0d0d0d]/40 hover:text-[#0d0d0d] text-lg font-light">−</button>
              <span className="text-2xl font-bold w-6 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>{copias}</span>
              <button onClick={() => setCopias((v) => Math.min(5, v + 1))} className="w-8 h-8 flex items-center justify-center text-[#0d0d0d]/40 hover:text-[#0d0d0d] text-lg font-light">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pagos ─── */
function Pagos({ pagos, totalIngresos, eventos, onActualizar }: any) {
  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", "Pagado", "Pendiente", "Fallido"];
  const filtrados = filtro === "Todos" ? pagos : pagos.filter((p: any) => p.estado === filtro);
  const pendientes = pagos.filter((p: any) => p.estado === "Pendiente").reduce((s: number, p: any) => s + Number(p.monto), 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-3 gap-px bg-[#0d0d0d]/10">
        {[
          { etiqueta: "Total Recaudado", valor: `$${totalIngresos.toLocaleString()}`, sub: "pagado" },
          { etiqueta: "Pendiente", valor: `$${pendientes}`, sub: "por cobrar" },
          { etiqueta: "Transacciones", valor: pagos.length.toString(), sub: "total" },
        ].map((s, i) => (
          <div key={i} className="bg-[#e9e5dc] p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-3">{s.etiqueta}</p>
            <p className="text-4xl font-bold leading-none mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{s.valor}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#0d0d0d]/40">{s.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40">Historial de Pagos</p>
          <div className="flex gap-1">
            {filtros.map((f) => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors ${filtro === f ? "bg-[#0d0d0d] text-[#e9e5dc]" : "text-[#0d0d0d]/40 hover:text-[#0d0d0d]"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-[#0d0d0d]/10">
          <div className="grid grid-cols-6 py-3 border-b border-[#0d0d0d]/10">
            {["ID", "Invitado", "Fotos", "Monto", "Fecha", "Estado"].map((h) => (
              <p key={h} className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/30">{h}</p>
            ))}
          </div>
          {filtrados.length === 0 ? (
            <p className="py-8 text-sm font-light text-[#0d0d0d]/30">Sin resultados.</p>
          ) : (
            filtrados.map((p: any, i: number) => (
              <div key={p.id} className={`grid grid-cols-6 py-4 items-center border-b border-[#0d0d0d]/8 hover:bg-[#0d0d0d]/3 transition-colors ${i % 2 === 1 ? "bg-[#0d0d0d]/[0.015]" : ""}`}>
                <p className="text-[10px] font-mono text-[#0d0d0d]/30">TXN-{String(p.id).padStart(4, "0")}</p>
                <div>
                  <p className="text-sm font-light">{p.invitado}</p>
                  <p className="text-[10px] text-[#0d0d0d]/30">{p.email}</p>
                </div>
                <p className="text-sm font-light tabular-nums">{p.fotos}</p>
                <p className="text-sm font-medium">${p.monto}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#0d0d0d]/40">{p.fecha}</p>
                <select value={p.estado} onChange={(e) => onActualizar(p.id, e.target.value)}
                  className="bg-transparent text-[9px] uppercase tracking-[0.18em] font-medium focus:outline-none cursor-pointer text-[#0d0d0d]/60">
                  {["Pagado", "Pendiente", "Fallido"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Panel Eventos ─── */
function PanelEventos({ eventos, onCrear, onActualizar, onEliminar }: any) {
  const [seleccionado, setSeleccionado] = useState<number | null>(eventos[0]?.id ?? null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: "", lugar: "", fecha: "", hora: "", anfitrion: "", paquete: "Estándar · 3h", invitados: 100, notas: "" });

  const evento = eventos.find((e: any) => e.id === seleccionado);

  const handleCrear = async () => {
    if (!form.nombre || !form.fecha || !form.lugar) return;
    setGuardando(true);
    const nuevo = await onCrear({ ...form, activo: false, fotos: 0 });
    setSeleccionado(nuevo.id);
    setMostrarForm(false);
    setForm({ nombre: "", lugar: "", fecha: "", hora: "", anfitrion: "", paquete: "Estándar · 3h", invitados: 100, notas: "" });
    setGuardando(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Lista */}
      <div className="lg:col-span-1">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40">Próximos Eventos</p>
          <button onClick={() => setMostrarForm((v) => !v)}
            className={`text-[10px] uppercase tracking-[0.15em] font-medium transition-colors ${mostrarForm ? "text-[#0d0d0d]/40" : "text-[#0d0d0d] underline underline-offset-2"}`}>
            {mostrarForm ? "Cancelar" : "+ Nuevo"}
          </button>
        </div>

        {/* Form nuevo evento */}
        {mostrarForm && (
          <div className="mb-4 bg-[#0d0d0d]/5 p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-4">Nuevo Evento</p>
            {[
              { key: "nombre", label: "Nombre", type: "text", placeholder: "Boda Martínez" },
              { key: "lugar", label: "Lugar", type: "text", placeholder: "Salón Royal, CDMX" },
              { key: "fecha", label: "Fecha", type: "date", placeholder: "" },
              { key: "hora", label: "Hora", type: "text", placeholder: "7:00 PM" },
              { key: "anfitrion", label: "Anfitrión", type: "text", placeholder: "Ana & Luis" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/30 mb-1">{label}</p>
                <input type={type} placeholder={placeholder} value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-transparent border-b border-[#0d0d0d]/20 text-sm font-light py-1.5 focus:outline-none focus:border-[#0d0d0d]/60 placeholder-[#0d0d0d]/20" />
              </div>
            ))}
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/30 mb-1">Paquete</p>
              <select value={form.paquete} onChange={(e) => setForm((f) => ({ ...f, paquete: e.target.value }))}
                className="w-full bg-transparent border-b border-[#0d0d0d]/20 text-sm font-light py-1.5 focus:outline-none">
                {["Básico · 2h", "Estándar · 3h", "Premium · 4h", "Empresarial · 2h"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/30 mb-1">Invitados</p>
              <input type="number" value={form.invitados}
                onChange={(e) => setForm((f) => ({ ...f, invitados: parseInt(e.target.value) || 0 }))}
                className="w-full bg-transparent border-b border-[#0d0d0d]/20 text-sm font-light py-1.5 focus:outline-none" />
            </div>
            <button onClick={handleCrear} disabled={guardando || !form.nombre || !form.fecha}
              className="w-full mt-2 py-2.5 bg-[#0d0d0d] text-[#e9e5dc] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#0d0d0d]/80 transition-colors disabled:opacity-40">
              {guardando ? "Guardando..." : "Crear Evento"}
            </button>
          </div>
        )}

        {/* Event list */}
        <div className="space-y-px">
          {eventos.length === 0 ? (
            <p className="text-sm font-light text-[#0d0d0d]/30">Sin eventos. Crea uno.</p>
          ) : (
            eventos.map((ev: any) => (
              <button key={ev.id} onClick={() => setSeleccionado(ev.id)}
                className={`w-full text-left flex items-stretch transition-all duration-150 ${seleccionado === ev.id ? "bg-[#0d0d0d]" : "bg-[#0d0d0d]/5 hover:bg-[#0d0d0d]/10"}`}>
                <div className={`flex flex-col items-center justify-center px-4 py-4 min-w-[56px] border-r ${seleccionado === ev.id ? "border-white/10" : "border-[#0d0d0d]/10"}`}>
                  <p className={`text-[9px] uppercase tracking-[0.15em] ${seleccionado === ev.id ? "text-white/40" : "text-[#0d0d0d]/30"}`}>{diaSemana(ev.fecha)}</p>
                  <p className={`text-xl font-bold leading-tight ${seleccionado === ev.id ? "text-white" : "text-[#0d0d0d]"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    {ev.fecha.split("-")[2]}
                  </p>
                  <p className={`text-[9px] uppercase tracking-[0.1em] ${seleccionado === ev.id ? "text-white/40" : "text-[#0d0d0d]/30"}`}>
                    {MESES[parseInt(ev.fecha.split("-")[1]) - 1]}
                  </p>
                </div>
                <div className="flex-1 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-tight ${seleccionado === ev.id ? "text-white" : "text-[#0d0d0d]"}`}>{ev.nombre}</p>
                    {ev.activo && (
                      <span className={`text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 flex-none ${seleccionado === ev.id ? "bg-white/10 text-white/60" : "bg-[#0d0d0d]/10 text-[#0d0d0d]/50"}`}>Activo</span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-1 ${seleccionado === ev.id ? "text-white/40" : "text-[#0d0d0d]/40"}`}>
                    {ev.hora} · {ev.lugar?.split(",")[0]}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      {evento ? (
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-10 transition-all duration-300 ${evento.activo ? "bg-[#0d0d0d]" : "bg-[#0d0d0d]/8"}`}>
            <div className="flex items-start justify-between mb-6">
              <p className={`text-[10px] uppercase tracking-[0.2em] ${evento.activo ? "text-white/30" : "text-[#0d0d0d]/30"}`}>
                {formatFecha(evento.fecha)} · {evento.hora}
              </p>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] uppercase tracking-[0.18em] px-3 py-1.5 font-medium ${evento.activo ? "bg-white/10 text-white/70" : "bg-[#0d0d0d]/10 text-[#0d0d0d]/40"}`}>
                  {evento.activo ? "● En curso — sin cobro" : "○ Próximo — cobro activo"}
                </span>
                <button onClick={() => onActualizar(evento.id, { activo: !evento.activo })}
                  className={`text-[9px] uppercase tracking-[0.15em] px-3 py-1.5 font-medium transition-colors border ${evento.activo ? "border-white/20 text-white/50 hover:text-white/80" : "border-[#0d0d0d]/20 text-[#0d0d0d]/40 hover:text-[#0d0d0d]/70"}`}>
                  {evento.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
            <p className={`text-5xl leading-none mb-3 ${evento.activo ? "text-white" : "text-[#0d0d0d]"}`}
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{evento.nombre}</p>
            <p className={`text-sm font-light ${evento.activo ? "text-white/40" : "text-[#0d0d0d]/40"}`}>{evento.lugar}</p>
            <div className={`mt-6 pt-6 border-t flex items-center gap-3 ${evento.activo ? "border-white/10" : "border-[#0d0d0d]/10"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${evento.activo ? "bg-white/30" : "bg-[#0d0d0d]/30"}`} />
              <p className={`text-xs font-light ${evento.activo ? "text-white/40" : "text-[#0d0d0d]/40"}`}>
                {evento.activo
                  ? "Evento activo — el cobro está suspendido mientras el booth esté en sesión"
                  : "Evento sin iniciar — el cobro está habilitado para este evento"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-[#0d0d0d]/10">
            {[
              { etiqueta: "Anfitrión", valor: evento.anfitrion || "—" },
              { etiqueta: "Paquete", valor: evento.paquete || "—" },
              { etiqueta: "Invitados esperados", valor: `${evento.invitados || 0} personas` },
              { etiqueta: "Fotos tomadas", valor: evento.activo ? `${evento.fotos || 0}` : "—" },
            ].map((d, i) => (
              <div key={i} className="bg-[#e9e5dc] p-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/30 mb-1">{d.etiqueta}</p>
                <p className="text-sm font-light">{d.valor}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/40 mb-3">Notas</p>
            <NotasEvento key={evento.id} inicial={evento.notas || ""} onGuardar={(notas: string) => onActualizar(evento.id, { notas })} />
          </div>

          <button onClick={() => { onEliminar(evento.id); setSeleccionado(null); }}
            className="text-[9px] uppercase tracking-[0.2em] text-[#0d0d0d]/25 hover:text-red-400 transition-colors">
            Eliminar evento
          </button>
        </div>
      ) : (
        <div className="lg:col-span-2 flex items-center justify-center">
          <p className="text-sm font-light text-[#0d0d0d]/30">Selecciona o crea un evento.</p>
        </div>
      )}
    </div>
  );
}

function NotasEvento({ inicial, onGuardar }: { inicial: string; onGuardar: (n: string) => void }) {
  const [notas, setNotas] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  return (
    <>
      <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
        placeholder="Agrega notas para este evento..."
        className="w-full bg-transparent border border-[#0d0d0d]/15 text-sm font-light text-[#0d0d0d] p-5 resize-none h-24 focus:outline-none focus:border-[#0d0d0d]/40 placeholder-[#0d0d0d]/20" />
      <button onClick={async () => { setGuardando(true); await onGuardar(notas); setGuardando(false); }}
        className="mt-2 px-6 py-2.5 bg-[#0d0d0d] text-[#e9e5dc] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#0d0d0d]/80 transition-colors disabled:opacity-40">
        {guardando ? "Guardando..." : "Guardar notas"}
      </button>
    </>
  );
}

/* ─── Shared ─── */
function InsigniaEstado({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    Pagado: "text-[#2a6b3a]",
    Pendiente: "text-[#7a5a1e]",
    Fallido: "text-[#8b2a2a]",
  };
  return <span className={`text-[9px] uppercase tracking-[0.18em] font-medium ${estilos[estado] || "text-[#0d0d0d]/40"}`}>{estado}</span>;
}