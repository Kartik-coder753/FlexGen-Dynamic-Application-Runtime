# Security Specification for FlexGen

## 1. Data Invariants
- `content` documents MUST have a valid `ownerId` matching the request user.
- `content` documents MUST have an `entityType` that matches the request.
- `appConfigs` is read-only for public, reserved for future admin write.

## 2. Dirty Dozen Payloads (Target: /content/{id})

1. **Spoofing Owner**: `ownerId` set to another user's UID.
2. **Entity Injection**: `entityType` set to a non-existent entity to bypass validation.
3. **Shadow Fields**: Adding `isAdmin: true` to the `data` object.
4. **ID Poisoning**: Using a 1MB string as the document ID.
5. **Timestamp Bypass**: Providing a client-side `createdAt` instead of server timestamp.
6. **No-Verify Write**: Writing without an email-verified token (if required).
7. **Cross-Entity Read**: Attempting to list all content without filtering by `ownerId`.
8. **Malicious Schema**: `data` containing nested maps deeper than 10 levels.
9. **Resource Exhaustion**: Writing a 1MB string to a text field.
10. **Type Mismatch**: Sending a string to a field defined as `number`.
11. **Immutability Breach**: Attempting to change `entityType` during an update.
12. **Unauthenticated Query**: Accessing the collection without auth.

## 3. Test Runner (Draft)
- `PERMISSION_DENIED` expected for all payloads above.
