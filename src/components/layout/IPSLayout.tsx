import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { IPSSidebar } from '@/components/sidebar/IPSSidebar';
import { ReactNode } from 'react';

interface IPSLayoutProps {
  children: ReactNode;
}

export const IPSLayout = ({ children }: IPSLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <IPSSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b border-border bg-card px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Intrusion Prevention System
              </h1>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};