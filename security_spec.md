# Security Specification for Dolver AI

## Data Invariants
1. **User Invariant**: A user record can only be read or written by the authenticated owner (`request.auth.uid == userId`). No user can view, edit, or modify another user's profile, usage limits, or subscription level.
2. **Subscription Escalation Prevention**: A user cannot update their own subscription level (`subscriptionPlan` or reset timestamp) directly, nor can they bypass usage limits or tamper with usage stats.
3. **Chat Ownership Invariant**: A user's chat logs and messages can only be read, created, or deleted by the authenticated owner. No cross-user session scraping is allowed.
4. **Structural Validity**: All IDs must be formatted strings (`isValidId()`), and text elements must be bound to prevent denial-of-wallet resource attacks.

---

## The "Dirty Dozen" Payloads (Attacks on Identity, Integrity, & State)

1. **Spoofed Read Attack**: Trying to query another user's user model `/users/attacker_id` while logged in as a different user.
2. **Direct Subscription Upgrade**: An authenticated free-tier user attempting to update their `subscriptionPlan` to `"Pro V"` directly in Firestore.
3. **Usage Limit Reset Hack**: A user whose usage limit is reached sending a patch requesting `academicUsageCount = 0` and `nonAcademicUsageCount = 0` to bypass limits.
4. **Creation of User for Someone Else**: An attacker trying to initialize a user document at `/users/victim_user_id` using their own auth token.
5. **Cross-User Chat Log Reading**: Trying to fetch / read `/users/victim_uid/chats/some_chat` as `attacker_uid`.
6. **Cross-User Chat Scraping (List Attack)**: Requesting lists of chats on `/users/victim_uid/chats` as `attacker_uid`.
7. **Junk Character ID Attack**: Creating a chat with 5KB length junk string as document ID (`/users/current_uid/chats/[junk_string]`) to exhaust resources.
8. **Shadow Field Injection**: Creating a chat containing arbitrary unauthorized properties (e.g. `isVerifiedAdmin: true`, `backdoor: "activated"`).
9. **Chat Theft**: Updating an existing chat ID or ownership fields to lock someone else out.
10. **Timestamp Spoofing**: Attempting to set `createdAt` or `updatedAt` to a future timestamp from the client bundle (must enforce `request.time` sync).
11. **Impersonated Assistant Response**: A user attempting to write a message under `role: "assistant"` directly in their chat to mock or spoof AI records (the UI should handle AI rendering, but backend rules must block unverified assistant role creation from client side).
12. **Bypassing Invariant Deletion**: Admin subcollection deletion or spoofing tasks where attackers delete crucial billing metrics.

---

## Test Runner Mockup

For verification, we document our security rules in `firestore.rules` below.
