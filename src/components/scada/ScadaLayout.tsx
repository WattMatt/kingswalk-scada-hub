import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScadaSidebar } from "@/components/scada/ScadaSidebar";

interface ScadaLayoutProps {
  children: React.ReactNode;
}

export function ScadaLayout({ children }: ScadaLayoutProps) {
  const now = new Date();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ScadaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground font-mono">KINGSWALK POWER STATION</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-scada-green animate-pulse-glow" />
                <span className="text-xs font-mono text-scada-green">ONLINE</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {now.toLocaleDateString("en-GB")} {now.toLocaleTimeString("en-GB")}
              </span>
            </div>
          </header>
          <main className="flex-1 p-4 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
