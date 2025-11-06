# Phase 3: Bundle Size Analysis & Optimization Strategy

**Analysis Date:** November 5, 2025  
**Branch:** `refactor/frontend-optimization`

---

## Bundle Size Findings

### Overall Bundle Health
- **Base JS (shared):** 81.9 KB ✅ (Healthy)
- **Average page size:** ~90 KB ✅ (Good)
- **Problem pages:** 2 pages at ~200 KB ⚠️

### Problem Pages Identified

| Route | Size | First Load JS | Issue |
|-------|------|---------------|-------|
| `/playground` | 8.35 KB | **200 KB** | ElevenLabs SDK |
| `/support-agent` | 16.1 KB | **208 KB** | ElevenLabs SDK |

**Root Cause:** `@elevenlabs/react` SDK (~118 KB) bundled on these pages

### Healthy Pages (Baseline)

| Route | First Load JS |
|-------|---------------|
| `/` | 89.5 KB |
| `/dashboard` | 91.7 KB |
| `/bookings` | 91.8 KB |
| `/campaigns` | 91 KB |
| `/conversations` | 89.6 KB |
| `/customers` | 91.6 KB |
| `/analytics` | 91.5 KB |
| `/settings` | 86 KB |
| `/tickets` | 91.4 KB |

---

## Optimization Strategy

### ✅ Already Optimal
1. **Icons:** Using individual imports from `lucide-react` (tree-shaking works)
2. **No Provider Bloat:** ElevenLabs provider not in root layout
3. **Only 2 pages use voice:** Limited blast radius

### 🎯 Optimizations to Apply

#### 1. **Dynamic Import for Voice Hook** (High Impact)
- Move `@elevenlabs/react` to lazy-loaded chunk
- Only load when user clicks "Start Voice"
- **Expected Reduction:** 118 KB → lazy loaded
- **Pages Affected:** `/playground`, `/support-agent`

#### 2. **Code Splitting for Chat Service** (Medium Impact)
- Separate OpenRouter chat logic into its own chunk
- Only load when user switches to chat mode
- **Expected Reduction:** ~15-20 KB → lazy loaded

#### 3. **Optimize Lucide Icons** (Low Impact)
- Icons already tree-shaken correctly
- No action needed ✅

#### 4. **Font Optimization** (Already Done)
- Using `next/font/google` with proper subsets
- No action needed ✅

---

## Implementation Plan

### Step 1: Dynamic Voice Hook
```typescript
// Before: Always bundled
import { useVoiceAgent } from '@/hooks/useVoiceAgent'

// After: Lazy loaded
const useVoiceAgent = dynamic(() => 
  import('@/hooks/useVoiceAgent').then(mod => ({ 
    default: mod.useVoiceAgent 
  })), 
  { ssr: false }
)
```

### Step 2: Lazy Chat Service
```typescript
// Only load when switching to chat mode
const startChat = async () => {
  const { sendMessage } = await import('@/lib/chatService')
  // Use chat functionality
}
```

### Step 3: Measure Impact
- Before: 200 KB first load
- Target: <95 KB first load (voice loads on-demand)

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| `/playground` First Load | 200 KB | ~90 KB | **-55%** |
| `/support-agent` First Load | 208 KB | ~92 KB | **-55%** |
| Voice agent bundle | Eager | Lazy | On-demand only |
| Initial page load | Slower | **Faster** | Better UX |

---

## Risk Assessment

### ✅ Low Risk
- Voice functionality only loads when needed
- No breaking changes to working features
- User experience improves (faster initial load)

### ⚠️ Considerations
- First voice session will have slight delay (~200ms)
- Need loading state during dynamic import
- Test on slow connections

---

## Next Steps

1. ✅ Document current bundle sizes
2. ⏳ Implement dynamic imports for voice hook
3. ⏳ Test voice session starts correctly
4. ⏳ Verify bundle size reduction
5. ⏳ Deploy and monitor
