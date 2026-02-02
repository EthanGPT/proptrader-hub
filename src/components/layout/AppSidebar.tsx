import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  Wallet,
  Building2,
  BarChart3,
  CalendarDays,
  TrendingUp,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useData, SyncStatus } from "@/context/DataContext";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Payouts", url: "/payouts", icon: DollarSign },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Prop Firms", url: "/prop-firms", icon: Building2 },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const syncConfig: Record<SyncStatus, { icon: typeof Cloud; label: string; color: string }> = {
  idle: { icon: Cloud, label: 'Cloud connected', color: 'text-sidebar-muted' },
  syncing: { icon: RefreshCw, label: 'Syncing...', color: 'text-sidebar-muted' },
  synced: { icon: CheckCircle2, label: 'Synced', color: 'text-success' },
  error: { icon: AlertCircle, label: 'Sync error', color: 'text-destructive' },
  disabled: { icon: CloudOff, label: 'Local only', color: 'text-sidebar-muted' },
};

export function AppSidebar() {
  const location = useLocation();
  const { syncStatus, triggerSync } = useData();
  const sync = syncConfig[syncStatus];
  const SyncIcon = sync.icon;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Ethan's</h1>
            <p className="text-xs text-sidebar-muted">Prop Tracker</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`h-11 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <button
          onClick={syncStatus !== 'disabled' ? triggerSync : undefined}
          disabled={syncStatus === 'disabled' || syncStatus === 'syncing'}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
            syncStatus !== 'disabled'
              ? "hover:bg-sidebar-accent cursor-pointer"
              : "cursor-default opacity-60"
          )}
        >
          <SyncIcon className={cn("h-4 w-4", sync.color, syncStatus === 'syncing' && "animate-spin")} />
          <span className={sync.color}>{sync.label}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
