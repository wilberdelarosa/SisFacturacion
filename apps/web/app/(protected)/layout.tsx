"use client";

import { AuthGuard } from "../../components/auth/AuthGuard";
import { SidebarNav } from "../../components/shell/SidebarNav";
import { Topbar } from "../../components/shell/Topbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
