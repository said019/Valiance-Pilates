import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight, Share, Plus, MoreVertical, X } from "lucide-react";
import heroPhoto from "@/assets/valiance-pilates-images/1000452092.jpg"; // muro mármol
import valianceLogo from "@/assets/valiance-pilates-logo.png";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});
type FormValues = { email: string; password: string };

const Login = () => {
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as any).standalone);
    if (isStandalone) return;
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setShowInstallBanner(true);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = params.get("returnUrl");
      if (returnUrl) { navigate(returnUrl); return; }
      if (["admin", "super_admin", "instructor", "reception"].includes(user.role)) navigate("/admin/dashboard");
      else navigate("/app");
    }
  }, [isAuthenticated, user]);

  const onSubmit = async (data: FormValues) => {
    clearError();
    try {
      await login(data);
      const { user: authedUser } = useAuthStore.getState();
      const returnUrl = params.get("returnUrl");
      if (returnUrl) { navigate(returnUrl, { replace: true }); return; }
      if (["admin", "super_admin", "instructor", "reception"].includes(authedUser?.role ?? "")) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    } catch {
      toast({ title: "Algo no cuadra", description: error ?? "Verifica tus credenciales", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-valiance-nude text-valiance-charcoal flex">
      {/* ── LEFT — visual editorial ── */}
      <aside className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-valiance-charcoal">
        <img
          src={heroPhoto}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-valiance-charcoal/90 via-valiance-charcoal/40 to-valiance-charcoal/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-valiance-charcoal via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Link to="/" className="inline-block self-start" aria-label="Valiance Pilates — Inicio">
            <img src={valianceLogo} alt="Valiance Pilates" className="h-16 w-auto brightness-[10] contrast-[1.2]" />
          </Link>

          <div className="max-w-[460px]">
            <span className="inline-flex items-center gap-2 text-[0.66rem] tracking-[0.22em] uppercase text-valiance-blush/80 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-valiance-gold animate-pulse-dot" />
              Bienvenida de vuelta
            </span>
            <h2
              className="font-display text-[clamp(2.6rem,4vw,4rem)] leading-[1.02] tracking-[-0.02em] text-valiance-nude mb-5"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Tu hora.<br />
              Tu fuerza.<br />
              <em className="not-italic text-valiance-blush">Tu valiance.</em>
            </h2>
            <p className="font-body text-[0.95rem] text-valiance-nude/70 leading-[1.75] max-w-[380px]">
              Entra a tu cuenta para reservar clases, ver tu paquete y revisar tu próxima sesión.
            </p>
          </div>
        </div>
      </aside>

      {/* ── RIGHT — formulario ── */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-10 relative">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="flex justify-center mb-10">
            <img src={valianceLogo} alt="Valiance Pilates" className="h-16 w-auto" />
          </Link>

          <header className="mb-9">
            <span className="text-[0.66rem] tracking-[0.22em] uppercase text-valiance-mauve font-medium mb-3 inline-block">
              Iniciar sesión
            </span>
            <h1
              className="font-display text-[clamp(2.4rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.02em] text-valiance-charcoal"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Hola otra vez.
            </h1>
            <p className="font-body text-[0.95rem] text-valiance-charcoal/65 mt-2">
              Te estábamos esperando.
            </p>
          </header>

          {error && (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive font-body text-[0.85rem] px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.66rem] tracking-[0.22em] uppercase text-valiance-mauve font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                {...register("email")}
                className="bg-valiance-blush/30 border border-transparent rounded-2xl px-4 py-3.5 font-body text-[0.92rem] text-valiance-charcoal placeholder:text-valiance-charcoal/35 focus:outline-none focus:bg-valiance-nude focus:border-valiance-mauve/40 transition-all"
              />
              {errors.email && <span className="text-[0.78rem] text-destructive font-body">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[0.66rem] tracking-[0.22em] uppercase text-valiance-mauve font-medium">
                  Contraseña
                </label>
                <Link to="/auth/forgot-password" className="font-body text-[0.78rem] text-valiance-mauve hover:text-valiance-charcoal transition-colors no-underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full bg-valiance-blush/30 border border-transparent rounded-2xl px-4 py-3.5 pr-12 font-body text-[0.92rem] text-valiance-charcoal placeholder:text-valiance-charcoal/35 focus:outline-none focus:bg-valiance-nude focus:border-valiance-mauve/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-valiance-mauve hover:text-valiance-charcoal transition-colors"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="text-[0.78rem] text-destructive font-body">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 bg-valiance-charcoal text-valiance-nude py-4 rounded-full text-[0.82rem] font-medium tracking-[0.06em] uppercase flex items-center justify-center gap-2.5 hover:bg-valiance-plum transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-valiance-gold focus-visible:ring-offset-2 focus-visible:ring-offset-valiance-nude"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={15} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-valiance-blush" />
            <span className="font-body text-[0.78rem] text-valiance-mauve">¿Primera vez?</span>
            <div className="flex-1 h-px bg-valiance-blush" />
          </div>

          <Link
            to="/auth/register"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-full border border-valiance-charcoal/15 text-valiance-charcoal text-[0.82rem] font-medium tracking-[0.06em] uppercase hover:bg-valiance-charcoal hover:text-valiance-nude hover:border-valiance-charcoal transition-all no-underline"
          >
            Crear cuenta
          </Link>

          <p className="text-center font-body text-[0.7rem] text-valiance-charcoal/40 mt-10">
            © {new Date().getFullYear()} Valiance Pilates
          </p>

          {showInstallBanner && (
            <div className="mt-6 relative bg-valiance-blush/50 rounded-2xl p-4">
              <button
                onClick={() => { setShowInstallBanner(false); sessionStorage.setItem("pwa-banner-dismissed", "1"); }}
                className="absolute top-2.5 right-2.5 text-valiance-mauve hover:text-valiance-charcoal transition-colors"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-3">
                <img src={valianceLogo} alt="" aria-hidden className="w-9 h-9 rounded-xl object-contain shrink-0 bg-valiance-nude p-1.5" />
                <div className="font-body text-[0.78rem] text-valiance-charcoal/80 leading-relaxed">
                  <p className="font-semibold text-valiance-charcoal mb-1.5">Instala la app en tu teléfono</p>
                  {isIOS ? (
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Toca <Share size={11} className="inline -mt-0.5 text-[#007AFF]" /> <span className="font-medium">Compartir</span></li>
                      <li>Selecciona <span className="font-medium">"Agregar a pantalla de inicio"</span> <Plus size={11} className="inline -mt-0.5" /></li>
                      <li>Confirma con <span className="font-medium">"Agregar"</span></li>
                    </ol>
                  ) : (
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Abre el menú <MoreVertical size={11} className="inline -mt-0.5" /></li>
                      <li>Selecciona <span className="font-medium">"Agregar a pantalla de inicio"</span></li>
                      <li>Toca <span className="font-medium">"Instalar"</span></li>
                    </ol>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
