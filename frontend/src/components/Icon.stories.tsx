import type { Meta, StoryObj } from "@storybook/react";
import {
  LayoutDashboard,
  ClipboardList,
  Beef,
  Settings,
  Sun,
  Moon,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  BellDot,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Menu,
  Home,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { Icon, ICON_SIZE_PX, type IconSize } from "@/components/Icon";

/**
 * Icon catalogue — #801
 *
 * StellarKraal uses **lucide-react** as its icon library.
 *
 * ## Size tokens
 * | Token | px | Tailwind  |
 * |-------|----|-----------|
 * | `sm`  | 16 | `h-4 w-4` |
 * | `md`  | 20 | `h-5 w-5` |
 * | `lg`  | 24 | `h-6 w-6` |
 *
 * ## Usage
 * ```tsx
 * import { Icon } from "@/components/Icon";
 * import { LayoutDashboard } from "lucide-react";
 *
 * // Decorative (aria-hidden applied automatically)
 * <Icon icon={LayoutDashboard} size="md" />
 *
 * // Semantic — expose to screen readers
 * <Icon icon={Bell} size="md" aria-label="Notifications" />
 * ```
 *
 * All icons are `aria-hidden` by default. Pass `aria-label` for icons that
 * carry meaning without accompanying visible text.
 */
const meta: Meta = {
  title: "Components/Icon",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Size token showcase ───────────────────────────────────────────────────────

export const SizeTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-brown-700">Icon size tokens</h2>
      <div className="flex items-end gap-8">
        {(["sm", "md", "lg"] as IconSize[]).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <Icon icon={LayoutDashboard} size={size} className="text-brown-600" />
            <span className="text-xs font-mono text-brown-500">
              {size} — {ICON_SIZE_PX[size]}px
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ── Navigation icons ──────────────────────────────────────────────────────────

const NAV_ICONS = [
  { icon: LayoutDashboard, name: "LayoutDashboard", usage: "Dashboard nav" },
  { icon: ClipboardList, name: "ClipboardList", usage: "Loans nav" },
  { icon: Beef, name: "Beef", usage: "Collateral nav / brand logo" },
  { icon: Settings, name: "Settings", usage: "Settings nav" },
  { icon: User, name: "User", usage: "Profile nav" },
  { icon: Home, name: "Home", usage: "Home / back-to-top" },
  { icon: Menu, name: "Menu", usage: "Hamburger menu toggle" },
];

export const NavigationIcons: Story = {
  render: () => (
    <IconGrid title="Navigation" icons={NAV_ICONS} />
  ),
};

// ── Status / feedback icons ────────────────────────────────────────────────────

const STATUS_ICONS = [
  { icon: CheckCircle2, name: "CheckCircle2", usage: "Success toast / status" },
  { icon: XCircle, name: "XCircle", usage: "Error toast / status" },
  { icon: AlertTriangle, name: "AlertTriangle", usage: "Warning toast / status" },
  { icon: AlertCircle, name: "AlertCircle", usage: "Info / alert" },
  { icon: Info, name: "Info", usage: "Info toast" },
  { icon: Loader2, name: "Loader2", usage: "Loading spinner" },
];

export const StatusIcons: Story = {
  render: () => (
    <IconGrid title="Status & feedback" icons={STATUS_ICONS} />
  ),
};

// ── Notification icons ─────────────────────────────────────────────────────────

const NOTIFICATION_ICONS = [
  { icon: Bell, name: "Bell", usage: "Notification (none)" },
  { icon: BellDot, name: "BellDot", usage: "Notification badge present" },
];

export const NotificationIcons: Story = {
  render: () => (
    <IconGrid title="Notifications" icons={NOTIFICATION_ICONS} />
  ),
};

// ── Theme icons ────────────────────────────────────────────────────────────────

const THEME_ICONS = [
  { icon: Sun, name: "Sun", usage: "Switch to light mode" },
  { icon: Moon, name: "Moon", usage: "Switch to dark mode" },
];

export const ThemeIcons: Story = {
  render: () => (
    <IconGrid title="Theme toggle" icons={THEME_ICONS} />
  ),
};

// ── Action / UI icons ──────────────────────────────────────────────────────────

const ACTION_ICONS = [
  { icon: Search, name: "Search", usage: "Search input" },
  { icon: X, name: "X", usage: "Close / dismiss" },
  { icon: Plus, name: "Plus", usage: "Add / expand" },
  { icon: Minus, name: "Minus", usage: "Remove / collapse" },
  { icon: Edit, name: "Edit", usage: "Edit action" },
  { icon: Trash2, name: "Trash2", usage: "Delete action" },
  { icon: Copy, name: "Copy", usage: "Copy to clipboard" },
  { icon: Check, name: "Check", usage: "Confirm / copied" },
  { icon: RefreshCw, name: "RefreshCw", usage: "Refresh / retry" },
  { icon: ExternalLink, name: "ExternalLink", usage: "Open in new tab" },
  { icon: MoreHorizontal, name: "MoreHorizontal", usage: "More actions / overflow" },
  { icon: ArrowLeft, name: "ArrowLeft", usage: "Back navigation" },
  { icon: ArrowRight, name: "ArrowRight", usage: "Forward navigation" },
  { icon: ChevronLeft, name: "ChevronLeft", usage: "Pagination / collapse" },
  { icon: ChevronRight, name: "ChevronRight", usage: "Pagination / expand" },
  { icon: ChevronUp, name: "ChevronUp", usage: "Sort ascending / accordion" },
  { icon: ChevronDown, name: "ChevronDown", usage: "Sort descending / accordion" },
];

export const ActionIcons: Story = {
  render: () => (
    <IconGrid title="Actions & UI" icons={ACTION_ICONS} />
  ),
};

// ── Full catalogue ─────────────────────────────────────────────────────────────

export const AllIcons: Story = {
  render: () => (
    <div className="space-y-10">
      <IconGrid title="Navigation" icons={NAV_ICONS} />
      <IconGrid title="Status & feedback" icons={STATUS_ICONS} />
      <IconGrid title="Notifications" icons={NOTIFICATION_ICONS} />
      <IconGrid title="Theme toggle" icons={THEME_ICONS} />
      <IconGrid title="Actions & UI" icons={ACTION_ICONS} />
    </div>
  ),
};

// ── Dark mode ─────────────────────────────────────────────────────────────────

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-brown-900 p-6 rounded-2xl">
      <div className="flex items-end gap-8">
        {(["sm", "md", "lg"] as IconSize[]).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <Icon icon={LayoutDashboard} size={size} className="text-cream-100" />
            <span className="text-xs font-mono text-brown-300">
              {size} — {ICON_SIZE_PX[size]}px
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ── Helper component ──────────────────────────────────────────────────────────

interface IconEntry {
  icon: typeof LayoutDashboard;
  name: string;
  usage: string;
}

function IconGrid({ title, icons }: { title: string; icons: IconEntry[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-brown-700 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {icons.map(({ icon, name, usage }) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-brown-100 bg-cream-50 dark:bg-brown-800 dark:border-brown-700"
          >
            {/* All three sizes side by side */}
            <div className="flex items-end gap-2">
              <Icon icon={icon} size="sm" className="text-brown-600 dark:text-cream-100" />
              <Icon icon={icon} size="md" className="text-brown-600 dark:text-cream-100" />
              <Icon icon={icon} size="lg" className="text-brown-600 dark:text-cream-100" />
            </div>
            <span className="text-xs font-mono text-brown-700 dark:text-cream-200 text-center leading-tight">
              {name}
            </span>
            <span className="text-[10px] text-brown-400 dark:text-brown-300 text-center leading-tight">
              {usage}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
