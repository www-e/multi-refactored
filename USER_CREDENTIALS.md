# 🔐 User Credentials - Demo Tenant

**Generated:** April 1, 2026
**Tenant ID:** `demo-tenant`

---

## 👑 Admin User

| Field | Value |
|-------|-------|
| **Email** | `admin@navaia.com` |
| **Password** | `Admin123!Admin123!` |
| **Name** | Administrator |
| **Role** | admin |
| **ID** | `usr_bb3e3467d9ab330b` |

---

## 👥 Regular Users

| Email | Name | Password | Role | ID |
|-------|------|----------|------|-----|
| `employee1@navaia.com` | محمد أحمد | `User123!` | user | `usr_a2aed1062d69ed9d` |
| `employee2@navaia.com` | فاطمة علي | `User123!` | user | `usr_4072c0facb489ba0` |
| `employee3@navaia.com` | عبدالله عمر | `User123!` | user | `usr_b6bbcfa287a6ee01` |
| `employee4@navaia.com` | نورة سعد | `User123!` | user | `usr_a579f581ae23bddf` |
| `employee5@navaia.com` | خالد Ibrahim | `User123!` | user | `usr_69aae807c1356aa6` |

---

## 📋 Quick Reference

### Admin Login
```
Email: admin@navaia.com
Password: Admin123!Admin123!
```

### Employee Login
```
Email: employee1@navaia.com
Password: User123!
```

### Authentication API
```bash
# Get access token
curl -X POST https://agentic.navaia.sa/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@navaia.com",
    "password": "Admin123!Admin123!"
  }'
```

---

## 🌐 Access URLs

- **Frontend:** https://agentic.navaia.sa/
- **Backend API:** https://agentic.navaia.sa/
- **Health Check:** https://agentic.navaia.sa/healthz

---

## 📝 Notes

- All users belong to tenant: `demo-tenant`
- Admin user has full system access
- Regular users have standard permissions
- Passwords can be changed via the Settings page
- Tokens expire in 15 minutes (use refresh token)
