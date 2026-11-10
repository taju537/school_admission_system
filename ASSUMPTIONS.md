# ASSUMPTIONS & DESIGN DECISIONS

This document outlines the architectural assumptions and design decisions made for the **School Admission System** take-home assignment (Onnorokom Projukti Limited).

---

## 1. Concurrency Control & Multi-Process Safety (Bonus §1.6)

### Requirement:
> *"কোনো অবস্থাতেই একটা class-এ held + confirmed সংখ্যা totalSeats-এর বেশি হবে না, যত request-ই একসাথে আসুক।"*
> 
> *Bonus: "একই database ব্যবহার করে backend-এর দুইটা process আলাদা port-এ একসাথে চললেও নিয়ম ১ ঠিক থাকা। কীভাবে নিশ্চিত করলেন, ASSUMPTIONS.md-এ লিখবেন।"*

### Implementation & Guarantee:
To ensure absolute seat consistency across multiple concurrent threads and multiple independent backend processes running simultaneously against the same PostgreSQL database, we implemented **Database-Level Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**:

1. **Explicit Transaction with Row Lock**:
   When a hold request is initiated (`POST /classes/{classId}/holds`), an explicit database transaction is started with `IsolationLevel.ReadCommitted`.
   The transaction immediately executes:
   ```sql
   SELECT "Id" FROM "Classes" WHERE "Id" = @classId FOR UPDATE;
   ```
2. **Serialization at the Row Level**:
   In PostgreSQL, `FOR UPDATE` places an exclusive lock on that specific class row until the transaction commits or aborts. Any concurrent requests—whether coming from the same backend instance or a second process on another port—are forced to queue and wait at the database level.
3. **Atomic Evaluation**:
   Inside this exclusive lock, the active non-expired held count is calculated:
   ```sql
   SELECT COUNT(*) FROM "Holds" 
   WHERE "ClassId" = @classId AND "Status" = 'HELD' AND "ExpiresAt" > @now;
   ```
   If `ConfirmedSeats + activeHeld >= TotalSeats`, the transaction is rolled back and a `409 Conflict` response is returned.
4. **Guaranteed Invariant**:
   Because no two transactions can hold the lock on the same class row simultaneously, race conditions, dirty reads, and phantom seat allocations are mathematically eliminated. `heldSeats + confirmedSeats <= totalSeats` is strictly preserved.

---

## 2. Dynamic Hold Expiration (§1.5 Rule 2)

### Requirement:
> *"আবেদনের মেয়াদ environment variable HOLD_DURATION_SECONDS দিয়ে ঠিক হবে (default 600)। মেয়াদ শেষ হলে seat নিজে থেকে ফেরত যাবে, কাউকে কোনো API call করতে হবে না।"*

### Implementation:
1. **Zero-Lag Seat Reclamation**:
   Rather than relying solely on a cron job or external sweeper, seat calculations dynamically check `ExpiresAt > DateTime.UtcNow`:
   ```csharp
   availableSeats = Math.Max(0, TotalSeats - ConfirmedSeats - heldSeats);
   ```
   The exact millisecond a hold passes its `expiresAt` timestamp, it is no longer counted as active. Its seat is immediately released back to `availableSeats` without requiring any background task or API call.
2. **Background Sweeper Service (`HoldExpirationBackgroundService`)**:
   A hosted background service runs every 5 seconds as a cleanup worker to mark expired rows with `Status = EXPIRED` for historical integrity.

---

## 3. Student Identification & Authentication (§1.3)

### Requirement:
> *"Login লাগবে না। Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে। UI এটাকেই শিক্ষার্থীর পরিচয় হিসেবে ব্যবহার করবে।"*

### Decisions:
1. **Identification**:
   - The student's 17-digit birth registration number is sent in the `X-Student-Id` HTTP request header for all student actions.
   - The backend validates that `X-Student-Id` consists of exactly 17 numeric digits (`^\d{17}$`). If invalid or missing, it returns `400 Bad Request`.
2. **Client-Side Persistence**:
   - Stored in browser `localStorage`. When the user refreshes or reopens the browser, the active student ID is restored and `/me/holds` is immediately fetched to display ongoing applications.

---

## 4. Idempotent Confirmation (§1.5 Rule 5)

### Requirement:
> *"একই আবেদনে confirm একাধিকবার এলেও confirmedSeats একবারই বাড়বে।"*

### Decision:
If `POST /holds/{holdId}/confirm` is invoked on a hold that is already in `CONFIRMED` status, the endpoint returns `200 OK` with `{ "holdId": holdId, "status": "CONFIRMED" }` without incrementing `ConfirmedSeats` again.

---

## 5. Cancellation Behavior (§1.4 #7)

### Decision:
When `DELETE /holds/{holdId}` is called with a matching `X-Student-Id`:
- If the hold is `HELD`, its status is updated to `CANCELLED`.
- Because active held seats are counted where `Status == 'HELD'`, changing to `CANCELLED` immediately releases the seat back to available seats.
- Returns `204 No Content` as specified in the contract.

