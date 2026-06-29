export default function PortalLoginLayout({ children }: { children: React.ReactNode }) {
  // Empty layout to override any parent layout (like PortalShell)
  // Wait, if it's inside `src/app/portal/layout.tsx`, the parent layout will wrap it. 
  // Let me just pass the children, and we'll fix the parent layout later to not wrap the login page.
  return <>{children}</>;
}
