"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/signin");
    },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name}</p>
    </div>
  );
}