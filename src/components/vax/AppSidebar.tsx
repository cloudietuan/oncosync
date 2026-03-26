import { useState } from 'react';
import {
  LayoutDashboard, TestTubes, Microscope, BarChart3, FlaskConical,
  Syringe, Shield, FileDown, Dna, CheckCircle2, ChevronDown, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  tab: number;
  setTab: (tab: number) => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, tab: 0 },
    ],
  },
  {
    label: 'Laboratory',
    items: [
      { title: 'Lab Records', icon: TestTubes, tab: 1 },
      { title: 'Tissue Analysis', icon: Microscope, tab: 2 },
      { title: 'Validation', icon: CheckCircle2, tab: 9 },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Expression Analysis', icon: BarChart3, tab: 3 },
      { title: 'VLP Simulation', icon: FlaskConical, tab: 4 },
      { title: 'T-Cell Proxy', icon: Dna, tab: 8 },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { title: 'Immune Tracking', icon: Syringe, tab: 5 },
      { title: 'Safety Monitoring', icon: Shield, tab: 6 },
    ],
  },
  {
    label: 'Reports',
    items: [
      { title: 'Export & Reports', icon: FileDown, tab: 7 },
    ],
  },
];

export function AppSidebar({ tab, setTab }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="bg-background">
      <SidebarContent className="pt-2 gap-1">
        {navGroups.map((group) => (
          <Collapsible key={group.label} defaultOpen={true} className="group/collapsible">
            <SidebarGroup>
              {!collapsed && (
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer select-none flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    {group.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = tab === item.tab;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                            onClick={() => setTab(item.tab)}
                            className={`text-[13px] font-medium transition-all duration-150 rounded-lg ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                            }`}
                          >
                            <motion.div
                              whileHover={{ rotate: [0, -12, 12, -6, 0], scale: 1.15 }}
                              animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.5, ease: 'easeInOut' }}
                              className="shrink-0"
                            >
                              <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                            </motion.div>
                            {!collapsed && <span>{item.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Install App"
              onClick={() => navigate('/install')}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-lg"
            >
              <Download className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Install App</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <p className="text-[9px] text-muted-foreground/40 px-2 pb-1 font-medium">
            OncoSync v1.0 · Research Only
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
