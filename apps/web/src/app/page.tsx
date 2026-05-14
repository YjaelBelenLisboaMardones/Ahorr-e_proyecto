import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1120] night-grid flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-emerald-400 text-xs font-medium tracking-wide uppercase">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Gestión financiera inteligente
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl font-bold mb-4 leading-tight text-white">
          Ahorr
          <span className="gradient-text">-E</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed max-w-md">
          Controlá tus finanzas, encontrá las mejores ofertas y recibí
          recomendaciones personalizadas con IA.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="glow-emerald-btn bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-sm tracking-wide"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="glass hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-300 text-sm"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-12 justify-center">
          {["Presupuestos", "Transacciones", "Ofertas Falabella", "IA Gemini"].map((f) => (
            <span
              key={f}
              className="glass text-slate-400 text-xs px-3 py-1.5 rounded-lg"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
