# ExpensesControl Security Audit Summary

**Date:** 2026-04-27
**Auditor:** Orchestrator (security-audit + dev agents)
**App Version:** main branch
**Status:** CRITICAL and HIGH issues fixed

---

## Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 4 | ✅ Fixed |
| High | 6 | ✅ Fixed |
| Medium | 3 | ⏳ Documented |
| Low | 2 | ⏳ Documented |

---

## Critical Issues (All Fixed)

### 1. `.env` File Not in `.gitignore`
- **File:** `server/.env`, `client/.env`
- **Issue:** JWT_SECRET, ENCRYPTION_KEY, VAPID keys in `.env` could be accidentally committed
- **Fix:** Added `.gitignore` to both `server/` and `client/` directories

### 2. `/uploads` Route Unprotected
- **File:** `server/src/index.js`
- **Issue:** Receipt images publicly accessible without authentication
- **Fix:** Added `auth` middleware before static file serving:
  ```js
  app.use('/uploads', auth, express.static(...));
  ```

### 3. Join Group Route Unprotected
- **File:** `client/src/App.jsx`
- **Issue:** `/join/:groupId` accessible without login
- **Fix:** Wrapped `JoinGroup` with `ProtectedRoute`

### 4. Missing Security Headers
- **File:** `server/src/index.js`
- **Issue:** No `helmet` middleware for security headers
- **Fix:** Installed and configured `helmet` middleware

---

## High Issues (All Fixed)

### 5. Low Entropy Invite Tokens
- **File:** `server/src/routes/invites.js`
- **Issue:** 8-character tokens from 6 random bytes = easily guessable
- **Fix:** 32 random bytes = 43 base64url characters
  ```js
  return crypto.randomBytes(32).toString('base64url');
  ```

### 6. Push Subscription Hijacking
- **File:** `server/src/routes/notifications.js`
- **Issue:** Any user could update any push subscription endpoint
- **Fix:** Added ownership verification before updating

### 7. Hardcoded VAPID Email
- **File:** `server/src/routes/notifications.js`
- **Issue:** Contact email hardcoded
- **Fix:** Uses `process.env.VAPID_CONTACT_EMAIL` with fallback

### 8. Route Mounting Conflict
- **File:** `server/src/index.js`
- **Issue:** Receipt routes mounted on `/api/expenses` conflicting with expense routes
- **Fix:** Changed to `/api/receipts`, updated client fetch URL

### 9. Settlement Amount Type Coercion
- **File:** `server/src/routes/settlements.js`
- **Issue:** `typeof amount !== 'number'` fails when client sends string
- **Fix:** Added `parseFloat` + `isNaN` validation

### 10. Weak Expense Authorization
- **File:** `server/src/routes/expenses.js`
- **Issue:** Any group member could view any expense (not just those they're involved in)
- **Fix:** Check if user is payer or in the splits

---

## Medium Issues (Documented, Not Fixed)

### 11. No `express-slow-down`
- Rate limiter blocks immediately; no gradual slowdown

### 12. `auth` Middleware Exported as Default
- `requireGroupMember` and `requireGroupCreator` could be called without `auth`

### 13. Client-Side Offline Queue in localStorage
- Sensitive expense data cached in localStorage (no encryption)

---

## Low Issues (Documented, Not Fixed)

### 14. No Content Security Policy customization
- Helmet default CSP may block some frontend features

### 15. Missing `db.close()` on shutdown
- Server process exit doesn't close database connections gracefully

---

## Verification

- ✅ Client builds successfully (`vite build` passes)
- ✅ Server starts without errors
- ✅ All 10 Critical/High issues fixed
- ✅ Changes committed to `main` branch

---

## Recommendations

1. **Regular dependency audits:** Run `npm audit` monthly
2. **Penetration testing:** Test with OWASP ZAP or Burp Suite
3. **Code review:** Have another developer review auth logic
4. **Logging:** Add security event logging (login attempts, failed auth, etc.)
5. **HTTPS:** Enable HTTPS in production with valid certificates
6. **Database encryption:** Encrypt sensitive fields at rest
