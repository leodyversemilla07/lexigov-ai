# Future Refactoring Opportunities

**Status:** 📋 Recommendations  
**Priority:** Medium

---

## Overview

After refactoring the draft editor page from 1,027 lines to 422 lines, several other pages remain candidates for similar component extraction.

---

## Large Pages Analysis

| Page | Lines | Complexity | Refactor Priority |
|------|-------|------------|-------------------|
| **ai/page.tsx** | 743 | High | 🔴 High |
| **export/page.tsx** | 697 | High | 🔴 High |
| **compliance/page.tsx** | 532 | Medium | 🟡 Medium |
| **templates/page.tsx** | 502 | Medium | 🟡 Medium |
| **compare/page.tsx** | 388 | Medium | 🟢 Low |
| **drafts/page.tsx** | 315 | Low | 🟢 Low |

---

## Recommended Refactorings

### 1. **AI Generator Page** (`ai/page.tsx` - 743 lines)

**Current State:**
- Large form with multiple prompt presets
- Complex state management for template integration
- Two-step flow: configure → preview
- Multiple conditional rendering sections

**Recommended Components:**
```
src/app/(protected)/ai/
├── _components/
│   ├── ai-config-form.tsx           # Document configuration form
│   ├── prompt-presets-panel.tsx     # Quick prompt templates
│   ├── generation-preview.tsx       # Generated content preview
│   ├── saved-template-panel.tsx     # Template integration panel
│   ├── tips-panel.tsx               # AI generation tips
│   ├── progress-steps.tsx           # Configure → Preview steps
│   └── types.ts                     # Route-specific types
└── page.tsx                         # Main orchestrator (target: <300 lines)
```

**Estimated Impact:**
- Main page: ~250-300 lines
- Improved testability of form logic
- Reusable prompt preset system

---

### 2. **Export Page** (`export/page.tsx` - 697 lines)

**Current State:**
- Complex DOCX generation logic
- PDF generation with layout calculations
- Multiple format handlers
- Preview generation
- Large helper functions inline

**Recommended Components:**
```
src/app/(protected)/export/
├── _components/
│   ├── draft-selector.tsx           # Draft selection dropdown
│   ├── version-selector.tsx         # Version picker
│   ├── format-selector.tsx          # Export format grid
│   ├── export-preview.tsx           # Preview panel
│   ├── export-actions.tsx           # Download/export buttons
│   └── types.ts
├── _lib/
│   ├── docx-builder.ts              # DOCX generation logic
│   ├── pdf-builder.ts               # PDF generation logic
│   └── export-helpers.ts            # Shared utilities
└── page.tsx                         # Main orchestrator (target: <250 lines)
```

**Estimated Impact:**
- Main page: ~200-250 lines
- Testable export generators
- Better separation of concerns

---

### 3. **Compliance Page** (`compliance/page.tsx` - 532 lines)

**Current State:**
- Draft selection logic
- Compliance analysis display
- Issue filtering and categorization
- Recommendations panel

**Recommended Components:**
```
src/app/(protected)/compliance/
├── _components/
│   ├── draft-selector.tsx           # Draft selection
│   ├── compliance-score-card.tsx    # Score display
│   ├── issues-list.tsx              # Issue breakdown
│   ├── issue-detail-card.tsx        # Individual issue display
│   ├── recommendations-panel.tsx    # Fix suggestions
│   └── types.ts
└── page.tsx                         # Main orchestrator (target: <250 lines)
```

**Estimated Impact:**
- Main page: ~200-250 lines
- Reusable compliance UI components
- Easier to add new issue types

---

### 4. **Templates Page** (`templates/page.tsx` - 502 lines)

**Current State:**
- Template listing with categories
- Template preview modal
- Create/edit template form
- Template usage tracking

**Recommended Components:**
```
src/app/(protected)/templates/
├── _components/
│   ├── template-grid.tsx            # Template card grid
│   ├── template-card.tsx            # Individual template
│   ├── category-filter.tsx          # Category navigation
│   ├── template-preview-modal.tsx   # Preview dialog
│   ├── template-editor-form.tsx     # Create/edit form
│   └── types.ts
└── page.tsx                         # Main orchestrator (target: <250 lines)
```

**Estimated Impact:**
- Main page: ~200-250 lines
- Reusable template components
- Better modal management

---

## Component Extraction Guidelines

### When to Extract a Component

Extract when a section:
1. **Exceeds 50 lines** and has clear responsibility
2. **Has independent state** that doesn't need to be in parent
3. **Could be reused** in other parts of the app
4. **Has complex logic** that would benefit from isolation
5. **Makes the parent harder to read**

### Where to Place Components

```
Route-specific (used only in one page):
  → _components/ next to page.tsx

Shared within route group:
  → (protected)/_components/

Shared app-wide:
  → src/components/
```

### Component Naming Conventions

- **Display components**: `<Noun>Card`, `<Noun>Panel`, `<Noun>Summary`
- **Interactive components**: `<Noun>Selector`, `<Noun>Form`, `<Noun>Editor`
- **Layout components**: `<Noun>Grid`, `<Noun>List`, `<Noun>Layout`
- **Container components**: `<Noun>Container`, `<Noun>Provider`

---

## Shared Components Opportunities

Consider creating shared components in `src/components/` for:

1. **SelectDraft** - Draft selection dropdown (used in export, compliance, compare)
2. **ComplianceScoreCard** - Reusable compliance display
3. **VersionSelector** - Version picker (used in export, compare)
4. **ExportButton** - Standardized export action button
5. **StatusBadge** - Draft status badge with colors

---

## Benefits of Continued Refactoring

### Code Quality
- ✅ Smaller, focused files
- ✅ Better separation of concerns
- ✅ Easier code reviews
- ✅ Improved git diffs

### Developer Experience
- ✅ Faster file navigation
- ✅ Better IDE performance
- ✅ Easier to onboard new developers
- ✅ Clear component responsibilities

### Testing
- ✅ Unit test individual components
- ✅ Mock dependencies easily
- ✅ Test edge cases in isolation
- ✅ Better test coverage

### Maintenance
- ✅ Bug fixes in isolated components
- ✅ Features added without affecting other code
- ✅ Easier refactoring of individual pieces
- ✅ Clear component boundaries

---

## Implementation Strategy

### Phase 1: High Priority (Next Sprint)
1. Extract AI page components
2. Extract Export page components

### Phase 2: Medium Priority (Following Sprint)
3. Extract Compliance page components
4. Extract Templates page components

### Phase 3: Shared Components (Ongoing)
5. Identify and extract shared components
6. Create component library documentation

---

## Success Metrics

Target for each refactored page:
- ✅ Main page file: **<300 lines**
- ✅ Each component: **<150 lines**
- ✅ Minimum **5 extracted components** per page
- ✅ Build time: **No increase**
- ✅ No functionality regressions

---

## Example: Before/After Pattern

### Before
```typescript
// page.tsx (700+ lines)
export default function MyPage() {
  // 50 lines of state
  // 100 lines of handlers
  // 500+ lines of JSX
  return (
    <div>
      {/* Massive inline JSX */}
    </div>
  )
}
```

### After
```typescript
// page.tsx (~200 lines)
import { FormPanel, PreviewPanel, ActionsPanel } from './_components'

export default function MyPage() {
  // 20 lines of state
  // 30 lines of handlers
  // 150 lines of clean JSX
  return (
    <div>
      <FormPanel {...props} />
      <PreviewPanel {...props} />
      <ActionsPanel {...props} />
    </div>
  )
}
```

---

## Resources

- [Component Composition Patterns](https://react.dev/learn/passing-props-to-a-component)
- [Extract Component Refactoring](https://refactoring.guru/extract-class)
- [Next.js Colocation Docs](https://nextjs.org/docs/app/building-your-application/routing/colocation)
