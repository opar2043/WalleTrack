# WalleTrack — Design System

The visual language, tokens, and component patterns used across the app.

## Core Palettes

### Light mode
| Token       | Hex       | Usage                          |
| ----------- | --------- | ------------------------------ |
| Background  | `#F5F5F7` | App background                |
| Surface     | `#FFFFFF` | Cards, inputs, tab bar         |
| Text        | `#1E1E2D` | Primary text                   |
| Border      | `#E5E7EB` | Hairlines, input borders       |
| Muted       | `#9CA3AF` | Secondary/hint text            |

### Dark mode
| Token       | Hex       | Usage                          |
| ----------- | --------- | ------------------------------ |
| Background  | `#121212` | App background                |
| Card        | `#1E1E2D` | Cards, tab bar                 |
| Border      | `#2A2A3C` | Hairlines, input borders       |
| Text        | `#FFFFFF` | Primary text                   |
| Muted       | `#6B7280` | Secondary/hint text            |

### Brand
| Token      | Hex       | Usage                             |
| ---------- | --------- | --------------------------------- |
| Primary    | `#6C5CE7` | Buttons, active/focus, progress   |
| Accent     | `#FF6B4A` | FAB, expense, focus highlights    |
| Income     | `#10B981` | Income amounts, positive          |
| Danger     | `#EF4444` | Errors, delete, overspend         |
| Warning    | `#F59E0B` | Near-limit states                 |

## Category colors
Reusable palette (`src/constants/index.ts` → `CATEGORY_COLORS`):
`#6C5CE7 #FF6B4A #10B981 #3B82F6 #F59E0B #EC4899 #8B5CF6 #14B8A6 #EF4444 #6366F1 #F472B6 #9CA3AF #84CC16 #F97316 #0EA5E9`

## Typography
- **Family:** Poppins (`@expo-google-fonts/poppins`) — 400 Regular → 800 ExtraBold.
- Sizes via Tailwind/text classes: `text-xs`(12) `text-sm`(14) `text-base`(16) `text-lg`(18) `text-2xl`(24) `text-4xl`(36) `text-5xl`(48).
- Emphasis: `font-bold` for headings, `font-semibold` for labels.

## Radius & Elevation
- Cards/inputs: `rounded-2xl` (16) or `rounded-3xl` (24).
- Buttons/dots: `rounded-xl`/`rounded-2xl`.
- Shadows via Tailwind `shadow-*` + explicit `shadowOffset/Radius/elevation` styles for cards & FAB.

## Components
- **Button** — variants: `primary | secondary | outline | ghost | danger | accent`; sizes `sm | md | lg`; `loading`, `icon`.
- **Input** — labeled, error state, optional `leftIcon`/`rightElement`; dark/light surfaces.
- **BalanceCard** — dark gradient hero card, wave pattern, amount hidden/show toggle, currency sub-label.
- **Card / Screen / Avatar / LoadingState / EmptyState / Header** — shared primitives.
- **CustomTabBar** — floating rounded bar with a raised orange `+` FAB in the center (Add transaction).
- **CalendarStrip** — horizontal date strip for day-level filtering (reports/analytics).
- **TransactionListItem / CategoryIcon / CategoryListItem** — list + iconography + budget progress rows.

## Layout & Spacing
- Screen padding: `px-5` (20). Section gaps: `gap-3` (12) / `mb-4` (16).
- Bottom content padded `pb-32` so it clears the floating tab bar.
- Modals: bottom sheets (`animationType="slide"`, top drag handle) with `bg-black/50` scrim.
- Rounded numeric/icon chips use `*px` tint (e.g. `bg-[#6C5CE7]/10`) rather than solid blocks.

## Motion
- List entrances: Moti `from={{opacity:0, translateY:16}}` → animate, staggered by index.
- Toast: `react-native-toast-alert` (`ToastManager` at root).
- Pressable feedback via opacity state; FAB has elevated orange shadow.

## Notes
- Dark mode is controlled by `useThemeStore`, persisted to MMKV, and applied via the `dark:` variant — **write all new UI in both light and dark variants.**
- All user-facing strings come from i18n keys — never hardcode visible text.
