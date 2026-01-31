import { 
  LayoutDashboard, 
  DollarSign, 
  Receipt, 
  Wallet, 
  Building2, 
  BarChart3,
  TrendingUp
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Payouts", url: "/payouts", icon: DollarSign },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Prop Firms", url: "/prop-firms", icon: Building2 },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();

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
    </Sidebar>
  );
}
