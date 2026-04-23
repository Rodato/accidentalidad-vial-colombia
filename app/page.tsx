import { Suspense } from "react";
import { Dashboard } from "./_components/Dashboard";
import { loadAll } from "./_lib/data";

export default async function Page() {
  const data = await loadAll();
  return (
    <main>
      <Suspense fallback={<div className="h-screen" />}>
        <Dashboard data={data} />
      </Suspense>
    </main>
  );
}
