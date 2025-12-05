# Outstanding Issues & Future Improvements

This document outlines remaining issues and improvements that should be addressed for the Agentic-Navaia platform.

## 🔴 Critical Issues

### 1. Webhook Tenant Context
- **Location**: `backend/app/api/routes/voice.py`
- **Issue**: Webhook endpoints (`/process` and `/voice/post_call`) can only update existing records but cannot create new ones without tenant context
- **Risk**: May cause legitimate voice sessions created via API to not be properly updated if webhook arrives before the session is created
- **Solution**: Implement webhook signature verification that includes tenant information or use conversation/session lookup to determine tenant

### 2. Bulk Operation Rate Limiting
- **Location**: `backend/app/api/routes/calls.py` - `create_bulk_calls` endpoint
- **Issue**: No rate limiting or concurrent operation limits
- **Risk**: Potential for abuse leading to excessive API calls to telephony service
- **Solution**: Implement rate limiting and operation batching

## 🟡 High Priority Improvements

### 3. Customer Name Consistency
- **Location**: Multiple files in both frontend and backend
- **Issue**: Inconsistent customer name generation and presentation (e.g., "Customer {id[:8]}" vs real names)
- **Impact**: UX inconsistency when users see different name formats
- **Solution**: Implement consistent customer naming strategy

### 4. Error Handling in Customer Detail Modal
- **Location**: `src/components/shared/modals/CustomerDetailModal.tsx`
- **Issue**: CRUD operations have basic error handling but could be more robust
- **Impact**: Poor user feedback when operations fail
- **Solution**: Add proper error boundaries and user-friendly error messages

### 5. Performance Optimization
- **Location**: `src/app/customers/page.tsx` and `CustomerDetailModal.tsx`
- **Issue**: Customer detail modal fetches all tickets/bookings instead of customer-specific data
- **Impact**: Performance degradation with large datasets
- **Solution**: Implement customer-specific data fetching and pagination

## 🟢 Medium Priority Improvements

### 6. Customer-Campaign Relationship
- **Location**: Various frontend components
- **Issue**: Customer detail modal shows all campaigns instead of customer-related campaigns
- **Note**: May require backend schema changes if customer-campaign relationship is needed

### 7. Voice Session Data Consistency
- **Location**: `backend/app/api/routes/voice.py`
- **Issue**: Some voice session fields may not be properly populated or validated
- **Impact**: Inconsistent data in voice sessions

### 8. User Experience Enhancements
- **Location**: Customer detail modal
- **Issue**: CRUD operations show alerts instead of integrated forms
- **Solution**: Implement inline forms for better UX

## 🔵 Security Considerations

### 9. API Key Management
- **Location**: `backend/app/api/routes/voice.py`
- **Issue**: API keys stored in environment variables without rotation mechanism
- **Risk**: Static credentials without rotation policy

### 10. Webhook Security Enhancement
- **Location**: `backend/app/api/routes/voice.py`
- **Issue**: Webhook signature verification could be strengthened
- **Solution**: Add additional validation measures

## 📋 Implementation Notes

### Completed Critical Fixes (Reference Only):
- ✅ Calls bulk endpoint tenant validation implemented
- ✅ Customer detail modal CRUD operations added
- ✅ Webhook endpoints secured to prevent unauthorized record creation
- ✅ Dashboard tenant isolation fixed
- ✅ State filters added to tickets/bookings
- ✅ "Playground guest" replaced with proper customer names

### Next Steps:
1. Address webhook tenant context issue (#1) as highest priority
2. Implement performance optimization (#5) for better scalability
3. Enhance error handling (#4) for better UX
4. Consider adding customer-campaign relationship if business logic requires it (#6)

---
*Last updated: December 2025*