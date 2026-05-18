# Security Specification - Sherp4 Phone Tracker

## Data Invariants
1. A phone record cannot exist without `model`, `imei`, and `buyPrice`.
2. Access to all phone and expense records is strictly restricted to the authorized owner (`msherpa621@gmail.com`).
3. `createdAt` is immutable.
4. `buyPrice` cannot be changed after creation (standard inventory integrity).
5. `status` must be one of: "In Stock", "Sold", "Personal Use", "On Sale".

## The Dirty Dozen Payloads (Unauthorized Attempts)
1. **Identity Spoofing**: User `other@gmail.com` trying to read `phones/` collection.
2. **Field Injection**: Creating a phone with a `root: true` hidden field.
3. **Type Poisoning**: Sending `buyPrice: "Cheap"` (string instead of number).
4. **ID Poisoning**: Creating a phone with a 1MB string as the document ID.
5. **State Shortcut**: Updating a phone to `Sold` without providing `sellPrice`. (Wait, status is in Phone entity, but we need to check transitions).
6. **Immutable Violation**: Trying to change `createdAt` of an existing phone.
7. **PII Leak**: Unauthorized user trying to list `phones` and seeing seller/buyer details.
8. **Resource Exhaustion**: Sending a 1MB `remarks` string.
9. **Orphaned Writes**: Creating an `expense` for a `phoneId` that doesn't exist.
10. **Zero-Verify Attack**: User with `email_verified: false` trying to write.
11. **Negative Price**: Creating a phone with `buyPrice: -100`.
12. **Status Corruption**: Setting status to "Destroyed" (not in enum).

## Test Cases
- [ ] DENY: Read phones by any user other than owner.
- [ ] DENY: Create phone without required fields.
- [ ] DENY: Update phone fields by non-owner.
- [ ] ALLOW: Owner creates phone with valid data.
- [ ] ALLOW: Owner updates phone status to Sold with sellPrice.
