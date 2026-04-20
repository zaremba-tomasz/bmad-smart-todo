# Accessibility Checklist (WCAG 2.1 AA)

Pre-review checklist for every story that ships UI components. Check each item during implementation, not only during review.

## Semantic HTML & Landmarks

- [ ] Correct semantic elements used (`<header>`, `<nav>`, `<main>`, `<section>`, `<button>`, etc.)
- [ ] No redundant ARIA roles on semantic elements (e.g., don't add `role="banner"` to `<header>`)
- [ ] Landmarks have descriptive `aria-label` when multiple of the same type exist (e.g., `<nav aria-label="Group filters">`)
- [ ] Heading levels are sequential and logical (`h1` → `h2` → `h3`, no skipping)

## Keyboard Navigation

- [ ] All interactive elements reachable via Tab key
- [ ] Tab order follows visual/logical reading order
- [ ] No keyboard traps (focus can always move away from an element)
- [ ] Escape key closes modals, popovers, and cancel-able interactions
- [ ] Focus is visible: `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2`
- [ ] Focus is managed after dynamic changes (e.g., focus moves to form after extraction, returns to input after save)
- [ ] Skip link targets are focusable (`tabindex="-1"` on target if not natively focusable)

## Screen Reader Support

- [ ] Dynamic content updates announced via `aria-live` regions (`polite` for non-urgent, `assertive` for critical)
- [ ] Form inputs have visible `<label>` elements (not placeholder-only)
- [ ] Error messages associated with fields via `aria-describedby`
- [ ] Loading states announced (e.g., "Processing your task..." if >800ms)
- [ ] State changes announced (e.g., "Task saved", "Task completed. N tasks completed.")
- [ ] Icon-only buttons have `aria-label` (e.g., `aria-label="Submit task"`)
- [ ] Decorative images/icons use `aria-hidden="true"`

## Touch Targets & Sizing

- [ ] All interactive elements are at least 44x44px on touch devices
- [ ] Input fields are at least 16px font size (prevents iOS Safari auto-zoom)
- [ ] Adequate spacing between tap targets to prevent mis-taps

## Color & Contrast

- [ ] Text contrast meets minimum 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- [ ] Information is not conveyed by color alone (e.g., priority badges include text, not just color)
- [ ] Focus indicators are visible against both light and dark backgrounds

## Motion & Animation

- [ ] All animations respect `prefers-reduced-motion: reduce` via `motion-reduce:` Tailwind prefix
- [ ] Reduced motion replaces animation with instant state change, not removal of feedback
- [ ] No animation exceeds 400ms (project constraint)
- [ ] Shimmer/loading states use static text alternative when reduced motion is active

## Forms & Validation

- [ ] Validation errors appear inline below the relevant field, not in toasts or summaries above the form
- [ ] Submit buttons are never disabled — always respond and show validation on attempt
- [ ] Required fields are indicated (but not solely via color)
- [ ] Form fields have autocomplete attributes where applicable

## Component-Specific Checks

### Task Items
- [ ] Checkbox touch target ≥ 44x44px
- [ ] Completion state change announced to screen readers
- [ ] Sync indicator has accessible label

### Capture Input
- [ ] `aria-label="Add a task"` with placeholder described via `aria-describedby`
- [ ] Keyboard shortcut (`/` or `Ctrl+K`) doesn't conflict with screen reader commands
- [ ] Desktop auto-focus present; mobile auto-focus absent (prevents virtual keyboard on load)

### Extraction Form
- [ ] Field reveal announced via ARIA live region
- [ ] Surface-extracted tint is decorative, not the only indicator of AI-populated fields
- [ ] Tab order through fields is logical: title → date → priority → location → Save
