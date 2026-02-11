import { useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  Wallet,
  Building2,
  BarChart3,
  CalendarDays,
  BookOpen,
  CrosshairIcon,
  TrendingUp,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  MoreHorizontal,
  Globe,
  LineChart,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useData, SyncStatus } from "@/context/DataContext";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trades", url: "/trades", icon: CrosshairIcon },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Econ Calendar", url: "/economic-calendar", icon: Globe },
  { title: "Financials", url: "/financials", icon: DollarSign },
];

const moreNav = [
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Prop Firms", url: "/prop-firms", icon: Building2 },
  { title: "Setups", url: "/setups", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const syncConfig: Record<SyncStatus, { icon: typeof Cloud; label: string; color: string }> = {
  idle: { icon: Cloud, label: 'Cloud connected', color: 'text-sidebar-muted' },
  syncing: { icon: RefreshCw, label: 'Syncing...', color: 'text-sidebar-muted' },
  synced: { icon: CheckCircle2, label: 'Synced', color: 'text-success' },
  error: { icon: AlertCircle, label: 'Sync error', color: 'text-destructive' },
  disabled: { icon: CloudOff, label: 'Local only', color: 'text-sidebar-muted' },
};

function NavItem({ item, isActive }: { item: typeof mainNav[0]; isActive: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          "h-10 rounded-lg transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <NavLink to={item.url} className="flex items-center gap-3 px-3">
          <item.icon className="h-4 w-4" />
          <span className="text-sm font-medium">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { syncStatus, triggerSync } = useData();
  const sync = syncConfig[syncStatus];
  const SyncIcon = sync.icon;

  const moreIsActive = moreNav.some((item) => location.pathname === item.url);
  const [moreOpen, setMoreOpen] = useState(moreIsActive);

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
            <TrendingUp className="h-3.5 w-3.5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">Prop Tracker</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={location.pathname === item.url}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* More section */}
        <SidebarGroup>
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted transition-colors hover:text-sidebar-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span>More</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 transition-transform duration-200",
                  moreOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="mt-1 space-y-0.5">
                  {moreNav.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      isActive={location.pathname === item.url}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
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
          <SyncIcon className={cn("h-3.5 w-3.5", sync.color, syncStatus === 'syncing' && "animate-spin")} />
          <span className={sync.color}>{sync.label}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
