/**
 * In-process mutex for queue operations.
 * One lock per doctorId ensures two receptionists can't advance
 * the same doctor's queue at the same time.
 *
 * Pattern: first caller acquires lock → does work → releases.
 * Second concurrent caller gets 409 Conflict immediately.
 */

const locks = new Map(); // doctorId → true

const lockService = {
  /**
   * Try to acquire lock for a doctorId.
   * Returns true if acquired, false if already locked.
   */
  acquire(doctorId) {
    const key = doctorId.toString();
    if (locks.get(key)) return false; // already locked
    locks.set(key, true);
    return true;
  },

  /** Release lock for a doctorId. */
  release(doctorId) {
    locks.delete(doctorId.toString());
  },

  /** Helper: run fn under lock, auto-release on finish or error. */
  async withLock(doctorId, fn) {
    if (!this.acquire(doctorId)) {
      const err = new Error("Queue operation already in progress for this doctor.");
      err.status = 409;
      throw err;
    }
    try {
      return await fn();
    } finally {
      this.release(doctorId);
    }
  },
};

module.exports = lockService;
