---
name: MUI → Tailwind + shadcn migration
description: Full migration from Material UI to Tailwind CSS v3 + lucide-react + radix-ui/react-tooltip completed
type: project
---

Migration from Material UI to Tailwind CSS v3 + shadcn/ui approach completed on 2026-03-29.

**Why:** User requested complete removal of Material UI in favor of Tailwind CSS + shadcn/ui.

**How to apply:** All MUI packages (@mui/material, @mui/icons-material, @mui/x-data-grid, @emotion/react, @emotion/styled) have been uninstalled. Any new component must use Tailwind classes only.

**Key decisions:**
- Icons: lucide-react (replaces @mui/icons-material)
- Tooltip: @radix-ui/react-tooltip (src/components/ui/Tooltip.tsx)
- Spinner: custom Tailwind (src/components/ui/Spinner.tsx)
- Modal: React createPortal with Tailwind overlay (no Radix Dialog)
- Drawer/Sheet: React createPortal with CSS transitions
- Responsive: useDimensions hook (width < 900 = mobile, width < 640 = small mobile) instead of useMediaQuery
- Colors: primary=#003D68, danger=#e36565 defined in tailwind.config.js
- Font: Titillium Web via Google Fonts (in index.css)
- Utils: src/lib/utils.ts with cn() function (clsx + tailwind-merge)
