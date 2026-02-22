import { createPostAction } from "@/actions/community";
import { PostsList } from "@/components/community/posts-list";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getUser, listCommunityPosts, listTopUsers } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await requireAuth();
  const [posts, leaderboard, user] = await Promise.all([listCommunityPosts(40), listTopUsers(10), getUser(session.uid)]);
  const placementMode = user?.goalType === "placement";

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">
          {placementMode ? "Job & Referral Feed" : "Community Feed"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {placementMode
            ? "Internships, job openings, referral requests, and peer discussions in one feed."
            : "Share milestones, resources, doubts, and relevant openings with your prep network."}
        </p>
      </GlassCard>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <form action={createPostAction} className="space-y-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Post type</span>
              <select
                name="type"
                defaultValue={placementMode ? "job" : "discussion"}
                className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
              >
                <option value="job">Job</option>
                <option value="referral">Referral</option>
                <option value="discussion">Discussion</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Post an update</span>
              <textarea
                name="content"
                placeholder={
                  placementMode
                    ? "Share openings, referral notes, interview experiences, or questions."
                    : "Share your mock score improvement, a strategy, resource, or a doubt."
                }
                minLength={5}
                maxLength={500}
                required
                className="min-h-28 rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100"
            >
              Publish
            </button>
          </form>
          <div className="mt-6">
            <PostsList posts={posts} />
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-white">Weekly Leaderboard</p>
          <div className="mt-3 space-y-2">
            {leaderboard.map((user, index) => (
              <div
                key={user.uid}
                className="flex items-center justify-between rounded-lg border border-slate-300/10 bg-slate-900/35 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-100">#{index + 1}</span>
                  <span className="text-slate-100">{user.name}</span>
                </div>
                <div className="text-xs text-slate-300">{user.xp} XP</div>
              </div>
            ))}
            {!leaderboard.length ? <p className="text-sm text-slate-300">No leaderboard data yet.</p> : null}
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
