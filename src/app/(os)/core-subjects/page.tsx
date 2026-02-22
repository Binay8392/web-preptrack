import { redirect } from "next/navigation";

import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

function progressFromSessions(totalHours: number, hoursDone: number) {
  if (!totalHours) return 0;
  return Math.min(100, Math.round((hoursDone / totalHours) * 100));
}

export default async function CoreSubjectsPage() {
  const session = await requireAuth();
  const data = await getPlacementDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  const subjects = [
    { key: "os", title: "Operating Systems", targetHours: 28, keywords: ["os", "operating"] },
    { key: "dbms", title: "DBMS", targetHours: 24, keywords: ["dbms", "database"] },
    { key: "cn", title: "Computer Networks", targetHours: 22, keywords: ["cn", "network"] },
  ];

  const mapped = subjects.map((subject) => {
    const studiedHours =
      data.sessions
        .filter((item) => {
          const name = (item.subjectName ?? "").toLowerCase();
          return subject.keywords.some((keyword) => name.includes(keyword));
        })
        .reduce((sum, item) => sum + item.duration, 0) / 60;
    return {
      ...subject,
      studiedHours: Number(studiedHours.toFixed(1)),
      progress: progressFromSessions(subject.targetHours, studiedHours),
    };
  });

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Core Subjects</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track placement-focused preparation across OS, DBMS, and Computer Networks.
        </p>
      </GlassCard>

      <section className="grid gap-4 lg:grid-cols-3">
        {mapped.map((subject) => (
          <GlassCard key={subject.key}>
            <p className="text-sm font-semibold text-white">{subject.title}</p>
            <p className="mt-1 text-xs text-slate-400">
              {subject.studiedHours}h / {subject.targetHours}h
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/55">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                style={{ width: `${subject.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-cyan-100">{subject.progress}% completion</p>
          </GlassCard>
        ))}
      </section>

      <GlassCard>
        <p className="text-sm font-semibold text-white">Interview Focus Areas</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>1. Process vs thread, scheduling, deadlock handling</li>
          <li>2. Indexing, normalization, transactions, isolation levels</li>
          <li>3. TCP/IP, HTTP lifecycle, congestion and routing basics</li>
        </ul>
      </GlassCard>
    </main>
  );
}
