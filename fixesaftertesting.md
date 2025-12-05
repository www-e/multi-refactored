# Fixes and Improvements Checklist

## Current Issues

1. Every user should have the data that he added and see it not all users data , becuase in the dashboard it shows every thing not only the user related data , also AHT should be calculated for each user not for all users , also the ROAS
2. What is the waiting in the dashbaord section , there is waiting section on on wait , what are these actaully , and lets remove it entirly
3. When editing any thing actaully , it should populate the data of the user or ticket in the form , also hte capaign or any thing , also viewing them
4. Add filters for the states of the tickets and bookings
5. Remove this playgroung guest and replace it with the actauly customer name and phone and email if existis , and filters for the states as well , both front end and back end please
6. When clicking on the customers on the table we should view the customers data in a dispaly modal as well as the ticket and every thing else like the bookings and campagisn , so we should create a shared modal that displays the data of them correctly and in a good format as well as the CRUD operations buttons in the modal
7. Every user should have his own data and not all users data , becaause that is the standard , i dont get all the users data when i am signed to only my credintals
8. The AHT should be calculated for each user not for all users , because that is the standard , i dont get all the users data when i am signed to only my credintals

## Implementation Checklist

### Data Isolation & Permissions
- [ ] Update backend API routes to filter data by authenticated user ID
- [ ] Modify database queries to include user ownership conditions
- [ ] Ensure all data fetching functions respect user boundaries
- [ ] Fix AHT calculation to compute per-user instead of global average
- [ ] Fix ROAS calculation to compute per-user instead of global metric

### Dashboard Improvements
- [ ] Remove "waiting" section from dashboard completely
- [ ] Update dashboard metrics to show user-specific data only
- [ ] Ensure all dashboard widgets display personalized content

### Form Enhancements
- [ ] Implement form population for editing existing records
- [ ] Add data prefilling for customer, ticket, booking, and campaign forms
- [ ] Ensure edit forms show current values before modification

### Filtering System
- [ ] Add state filters for tickets table
- [ ] Add state filters for bookings table
- [ ] Implement backend support for filtered queries
- [ ] Create frontend filter UI components

### Customer Management
- [ ] Replace "playground guest" with actual customer information (name, phone, email)
- [ ] Update customer display to show real customer data
- [ ] Add customer state filtering capabilities

### Modal & UI Components
- [ ] Create shared modal component for displaying data
- [ ] Implement customer detail view modal
- [ ] Add related data display (tickets, bookings, campaigns) in customer modal
- [ ] Include CRUD operation buttons in modal interface

### Easy Wins (Priority 1)
- [x] Remove "waiting" section from dashboard (Issue #2)
- [x] Update customer display to show real data instead of "playground guest" (Issue #5)
- [x] Add state filters for tickets and bookings (Issue #4)

### Core Issues (Priority 2)
- [x] Implement user data isolation (Issues #1, #7, #8)
- [x] Fix AHT calculation to be per-user (Issues #1, #8)
- [x] Implement form prefilling for edits (Issue #3)

### Advanced Features (Priority 3)
- [x] Create customer detail modal with related data (Issue #6)
- [x] Ensure full customer state filtering on both FE and BE (Issue #5)

### Security & Quality Assurance
- [x] Fix security vulnerability in calls bulk endpoint (tenant bypass)
- [x] Add CRUD operations to customer detail modal as promised
- [x] Ensure all API endpoints validate tenant ownership properly
