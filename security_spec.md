# Stride Firestore Security Specification

## 1. Data Invariants
1. Every document under `/users/{userId}` and its subcollections (`habits`, `tasks`, `diary`, `security`) is strictly owned by `request.auth.uid == userId`. Cross-user reads, lists, creates, updates, and deletes are rejected.
2. PII (`email`, `displayName`) in `/users/{userId}` is never readable by any user other than the owner (`isOwner(userId)`).
3. All document IDs (`userId`, `habitId`, `taskId`, `entryId`, `docId`) must match `^[a-zA-Z0-9_\-]+$` and stay within 128 characters.
4. `userId` and `createdAt` are immutable after document creation.
5. `updatedAt` on profiles, habits, and tasks is strictly enforced to match `request.time`.
6. Every write enforces strict schema keys (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly` on update) and explicit length/type/enum bounds matching `firebase-blueprint.json`.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. Unauthenticated read on `/users/alice/habits/h1` -> `PERMISSION_DENIED`.
2. Cross-user read by `bob` on `/users/alice` (PII leak test) -> `PERMISSION_DENIED`.
3. Cross-user list by `bob` on `/users/alice/tasks` -> `PERMISSION_DENIED`.
4. Identity spoofing on create: `bob` tries creating `/users/bob/habits/h1` with `userId: "alice"` -> `PERMISSION_DENIED`.
5. Shadow field injection on create: `alice` adds `isAdmin: true` to `/users/alice` -> `PERMISSION_DENIED`.
6. Oversized habit title (`61` chars) -> `PERMISSION_DENIED`.
7. Out-of-range habit target (`targetCount: 0` or `targetCount: 1000`) -> `PERMISSION_DENIED`.
8. Invalid task priority (`priority: "critical"`) -> `PERMISSION_DENIED`.
9. Oversized ID injection (`habitId` > 128 chars or containing `/`) -> `PERMISSION_DENIED`.
10. Immutable field mutation on update: `alice` changes `userId` or `createdAt` on a task -> `PERMISSION_DENIED`.
11. Client timestamp spoofing on habit update (`updatedAt` != `request.time`) -> `PERMISSION_DENIED`.
12. Arbitrary unmapped root collection write `/admins/alice` -> `PERMISSION_DENIED`.
