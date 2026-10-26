// The settings window (bise fait mac, mockup 10): what App.tsx renders in place of the main
// window's shell when the window is settings' own (openWindow kind settings, nm-frame's
// main/windows.ts: 780 × 600, one at a time, ⌘W closes it, it reopens on its last page). Only the
// hooks a settings window needs: his theme, macOS's accessibility, the vibrancy ground, the menu
// bar's actions and the routes main sends it (a second ⌘, with a page). The layout is
// Settings.tsx's; the add-a-project sheet is mounted here for settings › projects. Owner:
// nm-settings.
import { useRoute, useRouter } from '@/app/router';
import { useMainRoutes, useMenuRouting } from '@/app/menu';
import { useA11yRoot, useGroundRoot } from '@/app/a11yroot';
import { TipLayer } from '@/app/TipLayer';
import { MAIN } from '@/app/route';
import { useTheme } from '@/theme';
import { useStore } from '@/store';
import { AddSheetHost } from './AddSheet';
import { pickerPort } from './picker';
import { SettingsScreen } from './screen';

export function SettingsWindow() {
  const router = useRouter();
  const route = useRoute();
  useTheme();
  useA11yRoot();
  useGroundRoot();
  useMenuRouting(router);
  useMainRoutes(router);
  const store = useStore();
  return (
    <div className="b-ui settings-window" data-testid="settings.window">
      <SettingsScreen page={route.screen === 'settings' ? route.page : undefined} />
      <AddSheetHost
        send={(cmd) => {
          store.command(cmd);
        }}
        {...pickerPort()}
        onAdded={(rows) => {
          // the new project's thread opens in the main window (the router's Outside, where.ts)
          const first = rows[0];
          if (first !== undefined) router.go({ screen: 'thread', project: first.project, agent: MAIN });
        }}
      />
      <TipLayer />
    </div>
  );
}
