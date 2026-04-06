import { HomePage } from "@/app/website";

// Force client reference manifest generation for root route in standalone builds.
// Without this, the `(authenticated)/page.js` throws InvariantError:
// "The client reference manifest for route '/' does not exist"
// This happens because (authenticated)/layout.tsx is a 'use client' component
// that causes Next.js to resolve the parent route '/' manifest at runtime.
export const dynamic = "force-dynamic";

export default function Home() {
  return <HomePage />;
}
