# Manual Testing Checklist

## Pre-Merge Verification

**Date**: November 5, 2025  
**Tester**: _____________  
**Branch**: `cleanup/frontend-optimization`

---

## Build & Tests

- [x] `npm run build` - ✅ SUCCESS
- [x] `npm run lint` - ✅ 0 warnings/errors
- [x] `npm run type-check` - ✅ PASSED

---

## Critical User Flows

### 1. Application Load
- [ ] Homepage loads without errors
- [ ] Dashboard displays correctly
- [ ] No console errors in browser DevTools

### 2. Voice Agent (ElevenLabs)
- [ ] Navigate to `/playground`
- [ ] Select "Voice" mode
- [ ] Select agent type (Support or Sales)
- [ ] Click microphone button
- [ ] Verify connection established
- [ ] Speak and verify agent responds
- [ ] Verify transcript appears
- [ ] End call successfully

### 3. Chat Agent (OpenRouter)
- [ ] Navigate to `/playground`
- [ ] Select "Chat" mode
- [ ] Select agent type (Support or Sales)
- [ ] Send a message
- [ ] Verify AI response appears
- [ ] Verify WhatsApp-style UI renders correctly
- [ ] Send multiple messages (conversation flow)

### 4. Voice → Booking Flow
- [ ] Start voice call in playground
- [ ] Request to book an appointment (e.g., "أريد حجز موعد")
- [ ] Verify agent collects: name, phone, preferred date/time
- [ ] End call
- [ ] Navigate to `/bookings`
- [ ] Verify new booking appears in list
- [ ] Check booking status is "pending"

### 5. Dashboard
- [ ] Navigate to `/dashboard`
- [ ] Verify KPIs display (calls, conversion, revenue, etc.)
- [ ] Verify "Live Operations" section shows data
- [ ] Verify charts/graphs render
- [ ] Click "Simulate Call" button - verify it works
- [ ] Click "Simulate Message" button - verify it works

### 6. Conversations
- [ ] Navigate to `/conversations`
- [ ] Verify call list displays
- [ ] Click on a conversation
- [ ] Verify transcript appears in sidebar
- [ ] Verify audio player works (if available)
- [ ] Search for a conversation
- [ ] Filter by type (calls/messages)

### 7. Campaigns
- [ ] Navigate to `/campaigns`
- [ ] Verify campaign cards display
- [ ] Click on a campaign
- [ ] Verify details modal opens
- [ ] Click "Run" or "Pause" button
- [ ] Verify status updates

### 8. Bookings
- [ ] Navigate to `/bookings`
- [ ] Verify bookings list displays
- [ ] Check different status tabs (pending, confirmed, etc.)
- [ ] Click approve/reject on a booking
- [ ] Verify status changes

### 9. Tickets
- [ ] Navigate to `/tickets`
- [ ] Verify tickets list displays
- [ ] Check priority/category filters
- [ ] Click on a ticket
- [ ] Verify details display

### 10. Navigation & Layout
- [ ] Verify sidebar navigation works
- [ ] Click each menu item
- [ ] Verify proper page loads for each route
- [ ] Test theme toggle (if present)
- [ ] Verify responsive design (mobile/tablet/desktop)

---

## Browser Console Checks

### During Testing, Verify:
- [ ] No JavaScript errors in console
- [ ] No failed network requests (check Network tab)
- [ ] No React warnings about keys/props
- [ ] No hydration errors

---

## Performance Checks (Optional)

- [ ] Run Lighthouse audit on `/dashboard`
- [ ] Run Lighthouse audit on `/playground`
- [ ] Record Performance scores: _______
- [ ] Record Accessibility scores: _______

---

## Specific Changes Verification

### Image Fix in Playground
- [ ] Open `/playground` in chat mode
- [ ] Verify WhatsApp header shows agent icon (not external image)
- [ ] No "external image" warning in console
- [ ] Icon displays correctly

### Deleted Files Don't Break App
- [ ] No 404 errors for deleted pages
- [ ] No import errors referencing deleted files
- [ ] Backend API still works (bookings, tickets)

---

## Rollback Test (If Issues Found)

```bash
# If any test fails, rollback:
git stash  # or git reset --hard HEAD~1

# Then re-test to confirm rollback fixes the issue
```

---

## Sign-Off

**All tests passed?** [ ] YES / [ ] NO

**Issues found:** (list below if any)
_________________________________
_________________________________
_________________________________

**Tester Signature**: _____________  
**Date/Time**: _____________

---

## Notes

- If ANY critical test fails, DO NOT MERGE
- Document any failures in GitHub PR comments
- Re-test after fixes applied
