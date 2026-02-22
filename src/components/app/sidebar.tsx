"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Binary,
  Blocks,
  BriefcaseBusiness,
  BookOpenCheck,
  Bot,
  ChartNoAxesCombined,
  Compass,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Settings2,
  Target,
  Timer,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const examNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roadmap", label: "Roadmap", icon: Compass },
  { href: "/study-plan", label: "Study Plan", icon: Timer },
  { href: "/mock-tests", label: "Mock Tests", icon: Target },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/mindwell", label: "MindWell", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const placementNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dsa", label: "DSA", icon: Binary },
  { href: "/core-subjects", label: "Core Subjects", icon: GraduationCap },
  { href: "/aptitude", label: "Aptitude", icon: Blocks },
  { href: "/mock-tests", label: "Mock Tests", icon: Target },
  { href: "/dashboard/placement/virtual-interview", label: "Virtual Interview", icon: Bot },
  { href: "/company-tracker", label: "Company Tracker", icon: BriefcaseBusiness },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/mindwell", label: "MindWell", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

interface SidebarProps {
  name: string;
  photoURL: string;
  xp: number;
  goalType: "exam" | "placement";
}

export function Sidebar({ name, photoURL, xp, goalType }: SidebarProps) {
  const pathname = usePathname();
  const nav = goalType === "placement" ? placementNav : examNav;

  return (
    <aside
      className={`glass-card sticky top-4 h-[calc(100vh-2rem)] rounded-2xl p-4 ${
        goalType === "placement" ? "ring-1 ring-cyan-300/25" : ""
      }`}
    >
      <div className="mb-6 border-b border-slate-300/10 pb-4">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">PrepTrack OS</p>
        <p className="mt-2 text-lg font-semibold">
          {goalType === "placement" ? "Placement Console" : "Focus Console"}
        </p>
      </div>

      <nav className="space-y-1.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-cyan-300/20 text-cyan-100 ring-1 ring-cyan-200/40"
                  : "text-slate-300 hover:bg-slate-500/10 hover:text-slate-100",
              )}
            >
              <Icon className={cn("size-4", active ? "text-cyan-200" : "text-slate-400 group-hover:text-slate-200")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-slate-300/10 bg-slate-900/35 p-3">
        <div className="flex items-center gap-2">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt={name} className="size-10 rounded-full object-cover" />
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-cyan-400/25 text-sm font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="flex items-center gap-1 text-xs text-cyan-200/80">
              <BookOpenCheck className="size-3.5" />
              {xp} XP
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
