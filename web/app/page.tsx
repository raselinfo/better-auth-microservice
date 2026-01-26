import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight">
          Auth Service Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          A secure and scalable authentication microservice with magic links, social login, RBAC, and M2M support.
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link href="/auth/sign-in">
            <Button size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="lg">
              View Profile
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full">
            <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Features</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Magic Link Authentication</li>
                    <li>Social Login (Google)</li>
                    <li>Session Management</li>
                    <li>Linked Accounts</li>
                    <li>RBAC & M2M (Coming Soon)</li>
                </ul>
            </div>
            <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Tech Stack</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Better Auth</li>
                    <li>Next.js 15</li>
                    <li>Hono</li>
                    <li>Tailwind CSS & Shadcn UI</li>
                </ul>
            </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-muted-foreground">
        <p>© 2026 Auth Service Demo</p>
      </footer>
    </div>
  );
}
