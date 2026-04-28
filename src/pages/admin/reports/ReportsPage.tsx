import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AuthGuard } from "@/components/admin/AuthGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, Receipt, Users, BookOpen, UserPlus,
  CalendarDays, Activity, Star, Clock,
} from "lucide-react";

const ACCENT = {
  blush:    "#D9B5BA",
  mauve:    "#8C6B6F",
  gold:     "#C4A882",
  indigo:   "#6366F1",
  emerald:  "#10B981",
  amber:    "#F59E0B",
  sky:      "#0EA5E9",
  rose:     "#F43F5E",
} as const;

const ReportsPage = () => {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["reports-overview"],
    queryFn: async () => (await api.get("/reports/overview")).data,
  });

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["reports-revenue"],
    queryFn: async () => (await api.get("/reports/revenue")).data,
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["reports-classes"],
    queryFn: async () => (await api.get("/reports/classes")).data,
  });

  const { data: instructorsData, isLoading: loadingInstructors } = useQuery({
    queryKey: ["reports-instructors"],
    queryFn: async () => (await api.get("/reports/instructors")).data,
  });

  const { data: retentionData } = useQuery({
    queryKey: ["reports-retention"],
    queryFn: async () => (await api.get("/reports/retention")).data,
  });

  const o = overview?.data ?? overview ?? {};
  const retention = retentionData?.data ?? {};

  const safeArray = (v: any) => (Array.isArray(v) ? v : []);
  const fmtMonth = (raw: any) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(d);
  };

  const revenueRows = safeArray(revenue?.data ?? revenue);
  const revenueDataRaw = revenueRows.map((row: any) => ({
    month: fmtMonth(row.month),
    amount: Number(row.amount ?? row.total ?? 0),
    count: Number(row.count ?? 0),
  }));
  const revenueData = revenueDataRaw.length
    ? revenueDataRaw
    : Array.from({ length: 6 }).map((_, idx) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - idx));
        return { month: fmtMonth(d), amount: 0, count: 0 };
      });

  const classes: { name: string; bookings: number; attended: number }[] = safeArray(classesData?.data ?? classesData);
  const instructors: { id: string; name: string; classCount: number; totalStudents: number }[] = safeArray(instructorsData?.data ?? instructorsData);

  // Derivados del chart
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);
  const totalOrders = revenueData.reduce((sum, r) => sum + r.count, 0);
  const currentMonth = revenueData[revenueData.length - 1];
  const prevMonth = revenueData.length >= 2 ? revenueData[revenueData.length - 2] : null;
  const growth = prevMonth && prevMonth.amount > 0
    ? (((currentMonth.amount - prevMonth.amount) / prevMonth.amount) * 100).toFixed(1)
    : null;
  const avgRevenuePerMember = o.activeMembers > 0
    ? Number(o.monthlyRevenue ?? 0) / Number(o.activeMembers)
    : 0;

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatCurrencyCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const metric = (
    label: string,
    value: string | number | undefined,
    icon: React.ReactNode,
    accent: string,
    subtitle?: string,
    isLoading?: boolean,
  ) => (
    <Card className="border-t-2" style={{ borderTopColor: accent }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span style={{ color: accent }}>{icon}</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-2xl font-bold text-[#1A1A1A] tabular-nums">{value ?? "—"}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-[#8C6B6F]/20 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(payload[0].value)}</p>
        {payload[0]?.payload?.count > 0 && (
          <p className="text-xs text-[#1A1A1A]/50 mt-0.5">
            {payload[0].payload.count} orden{payload[0].payload.count !== 1 ? "es" : ""}
          </p>
        )}
      </div>
    );
  };

  const occupancy = Number(o.classOccupancyRate ?? 0);
  const totalReviews = Number(o.reviewsTotal ?? 0);
  const avgReviews = Number(o.reviewsAverage ?? 0);
  const pendingReviews = Number(o.reviewsPending ?? 0);
  const totalClients = Number(retention.total ?? 0);

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="admin-page max-w-6xl">
          <h1 className="text-2xl font-bold mb-6">Reportes</h1>

          {/* ── Primary KPIs ── */}
          <div className="stagger-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {metric(
              "Ingresos del mes",
              formatCurrency(Number(o.monthlyRevenue ?? 0)),
              <DollarSign size={18} />,
              ACCENT.blush,
              growth ? `${Number(growth) >= 0 ? "+" : ""}${growth}% vs mes anterior` : "Sin datos del mes anterior",
              loadingOverview,
            )}
            {metric(
              "Miembros activos",
              o.activeMembers ?? 0,
              <Users size={18} />,
              ACCENT.indigo,
              totalClients ? `${totalClients} clientes registrados` : undefined,
              loadingOverview,
            )}
            {metric(
              "Reservas del mes",
              o.monthlyBookings ?? 0,
              <BookOpen size={18} />,
              ACCENT.emerald,
              `${occupancy}% asistencia (check-in)`,
              loadingOverview,
            )}
            {metric(
              "Clientes nuevos",
              o.newMembersThisMonth ?? 0,
              <UserPlus size={18} />,
              ACCENT.gold,
              "Registrados este mes",
              loadingOverview,
            )}
          </div>

          {/* ── Secondary KPIs ── */}
          <div className="stagger-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metric(
              "Ingresos totales (12m)",
              formatCurrencyCompact(totalRevenue),
              <TrendingUp size={18} />,
              ACCENT.mauve,
              formatCurrency(totalRevenue),
              loadingRevenue,
            )}
            {metric(
              "Órdenes aprobadas",
              totalOrders,
              <Receipt size={18} />,
              ACCENT.amber,
              "Últimos 12 meses",
              loadingRevenue,
            )}
            {metric(
              "Clases programadas",
              o.upcomingClasses ?? 0,
              <CalendarDays size={18} />,
              ACCENT.sky,
              "Pendientes este mes",
              loadingOverview,
            )}
            {metric(
              "Ingreso por miembro",
              avgRevenuePerMember > 0 ? formatCurrencyCompact(avgRevenuePerMember) : "—",
              <Activity size={18} />,
              ACCENT.rose,
              "Promedio mensual",
              loadingOverview,
            )}
          </div>

          {/* ── Revenue Chart ── */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Ingresos mensuales</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Últimos 12 meses</p>
              </div>
              {growth && (
                <Badge
                  variant="outline"
                  className={Number(growth) >= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"}
                >
                  {Number(growth) >= 0 ? "↑" : "↓"} {Math.abs(Number(growth))}% vs mes ant.
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={revenueData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#8C6B6F20" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#1A1A1A", fontSize: 12 }}
                    axisLine={{ stroke: "#8C6B6F30" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#1A1A1A99", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#8C6B6F10" }} />
                  <Bar
                    dataKey="amount"
                    fill={ACCENT.blush}
                    radius={[6, 6, 0, 0]}
                    name="Ingresos"
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── Top classes + Instructors + Reviews ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top class types */}
            <Card>
              <CardHeader>
                <CardTitle>Clases más populares</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Por reservas totales</p>
              </CardHeader>
              <CardContent>
                {loadingClasses ? (
                  <div className="space-y-3">
                    {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sin datos</p>
                ) : (
                  <div className="stagger-in space-y-3">
                    {classes.slice(0, 6).map((c) => {
                      const max = classes[0]?.bookings || 1;
                      const pct = (c.bookings / max) * 100;
                      const attendRate = c.bookings > 0 ? (c.attended / c.bookings) * 100 : 0;
                      return (
                        <div key={c.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[#1A1A1A] truncate">{c.name}</span>
                            <span className="tabular-nums text-muted-foreground text-xs">
                              {c.bookings} reservas · {attendRate.toFixed(0)}% asistencia
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#8C6B6F]/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${ACCENT.blush}, ${ACCENT.mauve})`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top instructors */}
            <Card>
              <CardHeader>
                <CardTitle>Instructoras más activas</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Por clases impartidas</p>
              </CardHeader>
              <CardContent>
                {loadingInstructors ? (
                  <div className="space-y-3">
                    {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : instructors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sin datos</p>
                ) : (
                  <div className="stagger-in space-y-2">
                    {instructors.slice(0, 6).map((ins, idx) => (
                      <div
                        key={ins.id}
                        className="flex items-center justify-between rounded-lg border border-[#8C6B6F]/10 bg-[#FBF7F4]/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums shrink-0"
                            style={{
                              background: idx === 0 ? ACCENT.gold : `${ACCENT.mauve}20`,
                              color: idx === 0 ? "#1A1A1A" : ACCENT.mauve,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium truncate">{ins.name}</span>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <p className="tabular-nums font-semibold text-[#1A1A1A]">{ins.classCount} clases</p>
                          <p className="tabular-nums">{ins.totalStudents} alumnas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Reviews + Operational stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-t-2" style={{ borderTopColor: ACCENT.amber }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star size={16} style={{ color: ACCENT.amber }} />
                  Reseñas del mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold tabular-nums">{avgReviews.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">/ 5 promedio</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}
                      {pendingReviews > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                          <Clock size={11} /> {pendingReviews} por aprobar
                        </span>
                      )}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-2" style={{ borderTopColor: ACCENT.emerald }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity size={16} style={{ color: ACCENT.emerald }} />
                  Tasa de asistencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <p className="text-2xl font-bold tabular-nums">{occupancy}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-[#8C6B6F]/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${Math.min(100, occupancy)}%`,
                          backgroundColor: occupancy >= 70 ? ACCENT.emerald : occupancy >= 40 ? ACCENT.amber : ACCENT.rose,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Reservas con check-in / total</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-2" style={{ borderTopColor: ACCENT.indigo }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users size={16} style={{ color: ACCENT.indigo }} />
                  Cartera total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <p className="text-2xl font-bold tabular-nums">{totalClients}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Number(retention.newThisMonth ?? 0)} nuev{Number(retention.newThisMonth ?? 0) !== 1 ? "as" : "a"} este mes
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
};

export default ReportsPage;
