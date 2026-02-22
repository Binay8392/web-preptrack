import { redirect } from "next/navigation";

import { createCompanyApplicationAction } from "@/actions/company";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function CompanyTrackerPage() {
  const session = await requireAuth();
  const data = await getPlacementDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Company Tracker</h1>
        <p className="mt-2 text-sm text-slate-300">
          Manage applications, interview rounds, and outcomes across your target companies.
        </p>
      </GlassCard>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <GlassCard>
          <form action={createCompanyApplicationAction} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-300">
              Company Name
              <input
                name="companyName"
                required
                className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-300">
              Role
              <input
                name="role"
                defaultValue={data.user.targetRole ?? "Software Developer"}
                required
                className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-300">
              Status
              <select
                name="status"
                defaultValue="applied"
                className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
              >
                <option value="applied">Applied</option>
                <option value="oa">Online Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-300">
              Round
              <input
                name="round"
                defaultValue="Round 1"
                required
                className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-300 sm:col-span-2">
              Result
              <input
                name="result"
                defaultValue="pending"
                className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100"
              >
                Add Application
              </button>
            </div>
          </form>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-white">Pipeline Summary</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Total tracked: {data.companyApplications.length}</p>
            <p>Interview stage: {data.companyApplications.filter((item) => item.status === "interview").length}</p>
            <p>Offers: {data.companyApplications.filter((item) => item.status === "offer").length}</p>
          </div>
        </GlassCard>
      </section>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.13em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Round</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.companyApplications.map((item) => (
                <tr key={item.id} className="border-t border-slate-300/10">
                  <td className="px-3 py-3 text-slate-100">{item.companyName}</td>
                  <td className="px-3 py-3 text-slate-200">{item.role}</td>
                  <td className="px-3 py-3 text-cyan-100">{item.status}</td>
                  <td className="px-3 py-3 text-slate-200">{item.round}</td>
                  <td className="px-3 py-3 text-slate-300">{item.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.companyApplications.length ? (
            <p className="px-3 py-4 text-sm text-slate-300">No company applications tracked yet.</p>
          ) : null}
        </div>
      </GlassCard>
    </main>
  );
}
