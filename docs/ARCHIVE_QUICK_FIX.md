# Quick Fix Guide - LexiGov AI Build Errors

> **Status**: 🔴 Build currently FAILING  
> **Time to Fix**: ~30 minutes  
> **Difficulty**: Easy (syntax fixes)

---

## 🚨 Critical Fixes Required

### Fix #1: Reserved Keyword in exports.ts (2 minutes)

**File**: `apps/api/src/routes/exports.ts`  
**Problem**: Using reserved keyword `export` as variable name  
**Lines**: 135, 139, 143

#### Current Code (WRONG):
```typescript
// Line 135
const export = await prisma.exportHistory.findUnique({
  where: { id },
})

// Line 139
if (!export) {
  throw new ApiError('Export record not found', 404)
}

// Line 143
return reply.code(200).send(successResponse({ export }))
```

#### Fixed Code (CORRECT):
```typescript
// Line 135
const exportRecord = await prisma.exportHistory.findUnique({
  where: { id },
})

// Line 139
if (!exportRecord) {
  throw new ApiError('Export record not found', 404)
}

// Line 143
return reply.code(200).send(successResponse({ export: exportRecord }))
```

**Action**: Find and replace all 3 occurrences of the `export` variable.

---

### Fix #2: Duplicate Code in index.ts (1 minute)

**File**: `apps/api/src/routes/index.ts`  
**Problem**: Lines 50-180 are corrupted duplicates  
**Solution**: Delete lines 50-180, keep only lines 1-49

#### Current Structure:
- Lines 1-49: ✅ Correct routes registration
- Lines 50-180: ❌ **DELETE THESE** (duplicate garbage)

#### After Fix:
- File should be exactly 49 lines
- Ends with closing brace `}`

---

## ✅ Verification Steps

After making fixes, run:

```bash
# 1. Verify TypeScript compilation
pnpm --filter @lexigov/api build

# 2. Verify full project build
pnpm build

# 3. Initialize database (after build passes)
pnpm db:push

# 4. Start development server (optional)
pnpm dev
```

---

## 📋 Detailed Fix Instructions

### Method 1: Manual Editing

1. **Open** `apps/api/src/routes/exports.ts`
2. **Find** line 135: `const export = await prisma.exportHistory.findUnique(`
3. **Change** to: `const exportRecord = await prisma.exportHistory.findUnique(`
4. **Find** line 139: `if (!export) {`
5. **Change** to: `if (!exportRecord) {`
6. **Find** line 143: `successResponse({ export })`
7. **Change** to: `successResponse({ export: exportRecord })`
8. **Save** the file

9. **Open** `apps/api/src/routes/index.ts`
10. **Delete** all lines from line 50 to line 180
11. **Verify** file ends at line 49 with `}`
12. **Save** the file

13. **Run** `pnpm build` to verify

### Method 2: Using Find & Replace (Recommended)

**For exports.ts**:
1. Open `apps/api/src/routes/exports.ts`
2. Use Find & Replace (Ctrl+H or Cmd+H)
3. Find: `const export = `
4. Replace with: `const exportRecord = `
5. Replace (1 occurrence)
6. Find: `if (!export)`
7. Replace with: `if (!exportRecord)`
8. Replace (1 occurrence)  
9. Find: `{ export }`
10. Replace with: `{ export: exportRecord }`
11. Replace (1 occurrence)
12. Save

**For index.ts**:
1. Open `apps/api/src/routes/index.ts`
2. Select lines 50-180
3. Delete
4. Save

---

## 🧪 Testing After Fixes

```bash
# Test 1: API Build
cd apps/api
pnpm build

# Expected: ✅ Build successful

# Test 2: Full Build
cd ../..
pnpm build

# Expected: ✅ All packages build successfully

# Test 3: Database Init
pnpm db:push

# Expected: ✅ Database schema applied

# Test 4: Start Server (Optional)
pnpm dev

# Expected: ✅ Both web and API start successfully
```

---

## ⚠️ Common Mistakes to Avoid

1. **Don't rename the response property**
   - ❌ `successResponse({ exportRecord })`
   - ✅ `successResponse({ export: exportRecord })`
   
2. **Don't delete the wrong lines in index.ts**
   - Keep lines 1-49
   - Delete lines 50-180 ONLY

3. **Don't forget to save files**
   - Both files must be saved before running build

---

## 📊 Checklist

Before starting:
- [ ] Read this entire guide
- [ ] Have both files open in editor
- [ ] Backup created (optional but recommended)

Fix #1 (exports.ts):
- [ ] Line 135: Changed `export` to `exportRecord`
- [ ] Line 139: Changed `export` to `exportRecord`
- [ ] Line 143: Changed to `{ export: exportRecord }`
- [ ] File saved

Fix #2 (index.ts):
- [ ] Lines 50-180 deleted
- [ ] File now has exactly 49 lines
- [ ] File ends with `}`
- [ ] File saved

Verification:
- [ ] `pnpm build` runs successfully
- [ ] No TypeScript errors
- [ ] Ready to run `pnpm db:push`

---

## 🆘 If Something Goes Wrong

### Build still fails after fixes?
```bash
# Clear build cache
rm -rf apps/api/dist
rm -rf .turbo

# Try again
pnpm build
```

### See different errors?
- Check you edited the correct files
- Verify line numbers match
- Make sure you saved the files

### Need to restore original?
```bash
git checkout apps/api/src/routes/exports.ts
git checkout apps/api/src/routes/index.ts
```
Then start over with fixes.

---

## ✅ Success Criteria

You'll know the fixes worked when:
1. `pnpm build` completes with no errors ✅
2. You see "Build successful" messages ✅
3. Turbo shows all tasks completed ✅
4. No TypeScript compilation errors ✅

Then you can proceed with:
- `pnpm db:push` - Initialize database
- `pnpm dev` - Start development servers
- Continue with Phase 2 development 🚀

---

**Last Updated**: January 18, 2026  
**Estimated Fix Time**: 30 minutes
**Difficulty**: ⭐ Easy (beginner-friendly)
> Archived legacy document: this file refers to Prisma-based code paths that do not match the current Clerk + Convex application.
> Archived legacy document. This file refers to older Prisma-based code paths and is not the source of truth for the running app.
> Use `README.md` plus the current Clerk + Convex codebase instead.
