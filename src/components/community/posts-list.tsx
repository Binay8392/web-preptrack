import { formatDistanceToNow } from "date-fns";

import type { CommunityPostDocument } from "@/lib/types";

interface PostsListProps {
  posts: CommunityPostDocument[];
}

export function PostsList({ posts }: PostsListProps) {
  if (!posts.length) {
    return <p className="text-sm text-slate-300">No posts yet. Start the first discussion.</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-xl border border-slate-300/15 bg-slate-900/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            {post.userPhotoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.userPhotoURL} alt={post.userName} className="size-8 rounded-full object-cover" />
            ) : (
              <div className="grid size-8 place-items-center rounded-full bg-cyan-400/20 text-xs font-semibold">
                {post.userName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{post.userName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 uppercase tracking-[0.1em] text-cyan-100">
                  {post.type}
                </span>
                <span>{post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true }) : "just now"}</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-100">{post.content}</p>
        </article>
      ))}
    </div>
  );
}
