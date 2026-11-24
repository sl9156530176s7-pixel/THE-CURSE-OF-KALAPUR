# Security Specification — Strange Creation Owner Dashboard

## Phase 0: Core Data Invariants
1. **Owner-Only Read/List Isolation**: Only the verified Strange Creation owner (`sl9156530176s7@gmail.com` with `email_verified == true`) or a pre-registered admin document in `/admins/{uid}` may read, list, update, or delete `/downloads/{downloadId}` and `/ratings/{ratingId}` records. Visitors cannot enumerate, scrape, or alter other players' entries.
2. **Zero PII Harvesting**: `/downloads` and `/ratings` forbid arbitrary shadow fields (`isAdmin`, `email`, `phone`, `ip`, etc.) via strict `hasAll` and `hasOnly` allowlists.
3. **Temporal Integrity**: `createdAt` must strictly equal server `request.time` on creation and remain immutable on admin updates.
4. **Input & Resource Hardening**: All document IDs (`downloadId`, `ratingId`, `adminId`) must match `^[a-zA-Z0-9_-]+$` and stay within `<= 128` characters. Every string enforces explicit `.size()` bounds; stars must be integers `1..5`.
5. **No Admin Self-Promotion**: Clients can never create, update, or delete documents in `/admins/{adminId}`.

## Dirty Dozen Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated `list` on `/downloads`** — non-owner tries to query all downloader records.
2. **Unauthenticated `get` on `/ratings/{ratingId}`** — non-owner reads another player's review.
3. **Email Spoof with `email_verified: false`** — attacker sets email token `sl9156530176s7@gmail.com` with `email_verified: false`.
4. **Non-Owner Authenticated `list` on `/downloads`** — signed-in verified third-party Gmail user tries to open Owner Dashboard.
5. **Shadow Field Injection on `/downloads`** — visitor submits `{ ..., isAdmin: true, email: "x@y.com" }` (rejected by `hasOnly`).
6. **Client-Forged Timestamp on `/downloads`** — visitor passes `new Date("2020-01-01")` instead of `serverTimestamp()` (`request.time` mismatch).
7. **Invalid Platform Enum on `/downloads`** — visitor sends `platform: "hacked_os"` instead of `android | ios | desktop | other`.
8. **1MB String Denial-of-Wallet on `/ratings`** — visitor submits 50,000-char `comment` (`> 500` limit).
9. **Out-of-Range Stars on `/ratings`** — visitor submits `stars: 99` or `stars: 0` or `stars: "5"`.
10. **Path ID Poisoning on `/downloads/{downloadId}`** — attacker passes a 200-char ID or invalid characters (`$bad!id`).
11. **Non-Owner `delete` on `/ratings/{ratingId}`** — visitor tries to delete someone else's review.
12. **Privilege Escalation on `/admins/{uid}`** — signed-in user tries `setDoc(doc(db, 'admins', uid), { email: 'attacker@gmail.com' })`.
