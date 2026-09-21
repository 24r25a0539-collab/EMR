export type DoseStatus = 'UPCOMING' | 'TAKEN' | 'MISSED' | 'SNOOZED';

export interface MedicineItem {
  id: string;
  taskNumber?: number;           // Task 1, 2, 3, 4
  name: string;
  dosage: string;
  frequency: string;            // e.g. 'Twice Daily (Morning & Evening)'
  doseQuantity: number;          // e.g. 1 tablet per dose
  dailyRequiredQuantity: number; // e.g. 2 tablets per day
  timingSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  scheduledTime: string;         // Current active slot e.g. '08:00 AM'
  scheduleTimes: string[];       // All daily doses e.g. ['08:00 AM', '08:00 PM']
  scheduleSlots?: ('Morning' | 'Afternoon' | 'Evening' | 'Night')[]; // e.g. ['Morning', 'Evening']
  currentDoseIndex: number;      // 0 for first, 1 for second, etc.
  nextDoseTime: string;          // e.g. '08:00 PM (Evening)' or '08:00 AM (Tomorrow)'
  instructions: string;
  totalStock: number;            // e.g. 30
  remainingQuantity: number;     // e.g. 3
  unit: string;                  // 'tablets' | 'capsules' | 'pills'
  status: DoseStatus;
  snoozeUntil?: string;          // e.g. '08:15 AM'
  lastTakenAt?: string;
  lastTakenScheduledTime?: string; // e.g. '08:30 AM'
  takenAtTime?: string;            // e.g. '03:27 PM'
  nextScheduledSlot?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  nextScheduledTime?: string;      // e.g. '08:30 AM'
  nextDoseIndex?: number;
  nextScheduledTimestamp?: number;
  prescribedBy?: string;
  completedDoseKeys?: string[];  // Guarantees one dose can only reduce stock by 1 once
}

export interface RefillAlert {
  medicineId: string;
  name: string;
  remainingQuantity: number;
  dailyRequiredQuantity: number;
  daysRemaining: number;
  unit: string;
  warningMessage: string;
}

const STORAGE_KEY = 'emr_medicines_v6';
const EVENT_NAME = 'emr_medicine_changed';

const DEFAULT_MEDICINES: MedicineItem[] = [];

class MedicineService {
  private loadMedicines(): MedicineItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: MedicineItem[] = JSON.parse(raw);
      // Filter out any stale mock medicines
      const filtered = parsed.filter(item => 
        !item.id?.startsWith('med-metformin') && 
        !item.id?.startsWith('med-telmisartan') && 
        !item.id?.startsWith('med-rosuvastatin') && 
        !item.id?.startsWith('med-magnesium') &&
        item.name !== 'Metformin Hydrochloride' &&
        item.name !== 'Telmisartan Tablets IP' &&
        item.name !== 'Rosuvastatin Tablets IP' &&
        item.name !== 'Magnesium Glycinate'
      );
      return filtered.map((item, index) => ({
        ...item,
        taskNumber: item.taskNumber || (index + 1),
        scheduleSlots: item.scheduleSlots || (item.scheduleTimes?.length > 1 ? ['Morning', 'Evening'] : [item.timingSlot]),
        completedDoseKeys: item.completedDoseKeys || [],
      }));
    } catch {
      return [];
    }
  }

  private saveMedicines(items: MedicineItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save medicines to localStorage', e);
    }
  }

  public getAllMedicines(): MedicineItem[] {
    return this.loadMedicines();
  }

  /**
   * Calculates remaining treatment days:
   * remainingQuantity / dailyRequiredQuantity
   */
  public calculateDaysRemaining(remainingQuantity: number, dailyRequiredQuantity: number): number {
    if (dailyRequiredQuantity <= 0) return 0;
    const days = remainingQuantity / dailyRequiredQuantity;
    return Math.round(days * 10) / 10; // 1 decimal place precision
  }

  /**
   * STRICT REQUIREMENT:
   * Show "Refill Soon" ONLY when remainingDays < 2.0
   * 1.0 -> warning
   * 1.5 -> warning
   * 1.9 -> warning
   * 2.0 -> NO warning
   * 3.0 -> NO warning
   * 14.0 -> NO warning
   * (Do NOT use remainingDays <= 2)
   */
  public isRefillWarning(remainingQuantity: number, dailyRequiredQuantity: number): boolean {
    const days = this.calculateDaysRemaining(remainingQuantity, dailyRequiredQuantity);
    return days < 2.0;
  }

  /**
   * Mark dose as Completed / Taken:
   * - Mark this dose as Completed/Taken.
   * - Reduce the medicine stock/tablet count by 1.
   * - Do NOT reduce it again for the same task (one dose reduces stock by 1 ONCE).
   * - Automatically schedule/show the next dose according to the medicine schedule.
   * - If the medicine is scheduled Morning + Evening, after completing the
   *   Morning dose, the next reminder should be the Evening dose.
   * - Does NOT let completing Task 1 complete Task 2, Task 3, or Task 4.
   */
  public markDoseTaken(medicineId: string): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        const schedules = item.scheduleTimes && item.scheduleTimes.length > 0 
          ? item.scheduleTimes 
          : [item.scheduledTime];
        const slots = item.scheduleSlots && item.scheduleSlots.length > 0
          ? item.scheduleSlots
          : [item.timingSlot];

        const currentIdx = item.currentDoseIndex || 0;
        const currentSlot = slots[currentIdx] || item.timingSlot;
        const currentScheduleTime = schedules[currentIdx] || item.scheduledTime;

        // Unique dose key per day and dose index to guarantee single reduction per dose
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const doseKey = `${item.id}-${todayStr}-dose-${currentIdx}-${currentScheduleTime}`;
        const completedKeys = item.completedDoseKeys || [];

        // Check if this specific dose has already reduced stock
        const alreadyReduced = completedKeys.includes(doseKey);
        const nextStock = alreadyReduced 
          ? item.remainingQuantity 
          : Math.max(0, item.remainingQuantity - (item.doseQuantity || 1));
        const updatedCompletedKeys = alreadyReduced 
          ? completedKeys 
          : [...completedKeys, doseKey];

        // Determine next scheduled dose occurrence
        const nextIdx = currentIdx + 1;
        let nextSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
        let nextScheduledTime: string;
        let nextDoseTimeLabel: string;
        let isTomorrow = false;

        if (nextIdx < schedules.length) {
          // There is another dose scheduled for later today (e.g. Morning -> Evening)
          nextSlot = slots[nextIdx] || 'Evening';
          nextScheduledTime = schedules[nextIdx];
          nextDoseTimeLabel = `${nextScheduledTime} Today (${nextSlot})`;
          isTomorrow = false;
        } else {
          // Finished today's scheduled doses -> Next is first dose of Tomorrow
          nextSlot = slots[0] || 'Morning';
          nextScheduledTime = schedules[0];
          nextDoseTimeLabel = `${nextScheduledTime} Tomorrow`;
          isTomorrow = true;
        }

        const nextTimestamp = this.parseTimeToTimestamp(nextScheduledTime, isTomorrow);

        updatedItem = {
          ...item,
          status: 'TAKEN' as DoseStatus,
          remainingQuantity: nextStock,
          completedDoseKeys: updatedCompletedKeys,
          lastTakenScheduledTime: currentScheduleTime,
          takenAtTime: timeStr,
          lastTakenAt: `${currentScheduleTime} (Taken at ${timeStr})`,
          nextDoseTime: nextDoseTimeLabel,
          nextScheduledSlot: nextSlot,
          nextScheduledTime: nextScheduledTime,
          nextDoseIndex: nextIdx < schedules.length ? nextIdx : 0,
          nextScheduledTimestamp: nextTimestamp,
          snoozeUntil: undefined,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  /**
   * "next scheduled time vachinappudu" (When the next scheduled time arrives):
   * - Marks dose as UPCOMING so [ COMPLETE ] is displayed again
   * - Switches scheduledTime and timingSlot to the new dose
   * - Sets nextDoseTime to the subsequent dose
   * - Stock is NOT reduced yet (only reduced when user clicks [ COMPLETE ])
   */
  public advanceToNextScheduledTime(medicineId: string): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        const schedules = item.scheduleTimes && item.scheduleTimes.length > 0 
          ? item.scheduleTimes 
          : [item.scheduledTime];
        const slots = item.scheduleSlots && item.scheduleSlots.length > 0
          ? item.scheduleSlots
          : [item.timingSlot];

        const targetIdx = item.nextDoseIndex !== undefined ? item.nextDoseIndex : 0;
        const targetSlot = item.nextScheduledSlot || slots[targetIdx] || item.timingSlot;
        const targetScheduleTime = item.nextScheduledTime || schedules[targetIdx] || item.scheduledTime;

        // Subsequent dose calculation
        const subIdx = targetIdx + 1;
        let subDoseTimeLabel: string;
        if (subIdx < schedules.length) {
          subDoseTimeLabel = `${schedules[subIdx]} Today (${slots[subIdx]})`;
        } else {
          subDoseTimeLabel = `${schedules[0]} Tomorrow`;
        }

        updatedItem = {
          ...item,
          status: 'UPCOMING' as DoseStatus,
          timingSlot: targetSlot,
          scheduledTime: targetScheduleTime,
          currentDoseIndex: targetIdx,
          nextDoseTime: subDoseTimeLabel,
          nextScheduledTimestamp: undefined,
          snoozeUntil: undefined,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  /**
   * Periodic check: if Date.now() >= nextScheduledTimestamp, advance automatically
   */
  public checkDueSchedules(): void {
    const list = this.loadMedicines();
    let anyChanged = false;
    const now = Date.now();

    const next = list.map((item) => {
      if (item.status === 'TAKEN' && item.nextScheduledTimestamp && now >= item.nextScheduledTimestamp) {
        anyChanged = true;
        const schedules = item.scheduleTimes || [item.scheduledTime];
        const slots = item.scheduleSlots || [item.timingSlot];
        const targetIdx = item.nextDoseIndex !== undefined ? item.nextDoseIndex : 0;
        const targetSlot = item.nextScheduledSlot || slots[targetIdx] || item.timingSlot;
        const targetScheduleTime = item.nextScheduledTime || schedules[targetIdx] || item.scheduledTime;
        const subIdx = targetIdx + 1;
        const subDoseTimeLabel = subIdx < schedules.length 
          ? `${schedules[subIdx]} Today (${slots[subIdx]})` 
          : `${schedules[0]} Tomorrow`;

        return {
          ...item,
          status: 'UPCOMING' as DoseStatus,
          timingSlot: targetSlot,
          scheduledTime: targetScheduleTime,
          currentDoseIndex: targetIdx,
          nextDoseTime: subDoseTimeLabel,
          nextScheduledTimestamp: undefined,
          snoozeUntil: undefined,
        };
      }
      return item;
    });

    if (anyChanged) {
      this.saveMedicines(next);
    }
  }

  private parseTimeToTimestamp(timeStr: string, isTomorrow: boolean = false): number {
    const d = new Date();
    if (isTomorrow) {
      d.setDate(d.getDate() + 1);
    }
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
    }
    return d.getTime();
  }

  /**
   * "Remind me later" (Snooze):
   * - Do NOT mark the task as completed.
   * - Do NOT reduce tablet stock.
   * - Keep the same dose pending.
   * - Schedule the reminder again for later (default +15 min).
   * - Does NOT affect other tasks.
   */
  public snoozeDose(medicineId: string, minutes: number = 15): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        const d = new Date();
        d.setMinutes(d.getMinutes() + minutes);
        const snoozeTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        updatedItem = {
          ...item,
          status: 'SNOOZED' as DoseStatus,
          snoozeUntil: snoozeTime,
          // Tablet stock remains strictly unchanged!
          // completedDoseKeys is strictly unchanged!
          // currentDoseIndex is strictly unchanged; dose remains pending!
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  /**
   * Undo a dose marked as taken (restores stock & sets status back to UPCOMING)
   */
  public markDoseUpcoming(medicineId: string): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        const schedules = item.scheduleTimes && item.scheduleTimes.length > 0 
          ? item.scheduleTimes 
          : [item.scheduledTime];
        const slots = item.scheduleSlots && item.scheduleSlots.length > 0
          ? item.scheduleSlots
          : [item.timingSlot];

        // If snoozed, undo simply clears snooze back to UPCOMING without touching stock
        if (item.status === 'SNOOZED') {
          updatedItem = {
            ...item,
            status: 'UPCOMING',
            snoozeUntil: undefined,
          };
          return updatedItem;
        }

        const currentIdx = item.currentDoseIndex || 0;
        let prevIdx = currentIdx;
        if (item.status === 'TAKEN') {
          prevIdx = Math.max(0, currentIdx);
        } else if (currentIdx > 0) {
          prevIdx = currentIdx - 1;
        }

        const currentScheduleTime = schedules[prevIdx] || item.scheduledTime;
        const todayStr = new Date().toISOString().slice(0, 10);
        const doseKey = `${item.id}-${todayStr}-dose-${prevIdx}-${currentScheduleTime}`;
        const completedKeys = item.completedDoseKeys || [];
        const wasReduced = completedKeys.includes(doseKey);

        const restoredStock = wasReduced 
          ? item.remainingQuantity + (item.doseQuantity || 1) 
          : item.remainingQuantity;
        const updatedCompletedKeys = completedKeys.filter((k) => k !== doseKey);

        const prevSlot = slots[prevIdx] || item.timingSlot;
        const prevScheduledTime = schedules[prevIdx] || item.scheduledTime;
        const nextDoseTimeLabel = prevIdx + 1 < schedules.length 
          ? `${schedules[prevIdx + 1]} (${slots[prevIdx + 1] || 'Today'})`
          : `${schedules[0]} (Tomorrow)`;

        updatedItem = {
          ...item,
          status: 'UPCOMING',
          timingSlot: prevSlot,
          scheduledTime: prevScheduledTime,
          currentDoseIndex: prevIdx,
          nextDoseTime: nextDoseTimeLabel,
          remainingQuantity: restoredStock,
          completedDoseKeys: updatedCompletedKeys,
          lastTakenAt: undefined,
          lastTakenScheduledTime: undefined,
          takenAtTime: undefined,
          nextScheduledTimestamp: undefined,
          snoozeUntil: undefined,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  public getPendingRemindersCount(): number {
    const list = this.loadMedicines();
    return list.filter((item) => item.status !== 'TAKEN').length;
  }

  public getRefillAlerts(): RefillAlert[] {
    const list = this.loadMedicines();
    const alerts: RefillAlert[] = [];

    list.forEach((item) => {
      if (this.isRefillWarning(item.remainingQuantity, item.dailyRequiredQuantity)) {
        const days = this.calculateDaysRemaining(item.remainingQuantity, item.dailyRequiredQuantity);
        alerts.push({
          medicineId: item.id,
          name: item.name,
          remainingQuantity: item.remainingQuantity,
          dailyRequiredQuantity: item.dailyRequiredQuantity,
          daysRemaining: days,
          unit: item.unit,
          warningMessage: `Critically low stock! Only ${days} day(s) supply remaining (${item.remainingQuantity} ${item.unit}). Immediate refill recommended.`,
        });
      }
    });

    return alerts;
  }

  public subscribe(callback: () => void): () => void {
    return this.onMedicineChange(callback);
  }

  public onMedicineChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }

  public refillStock(medicineId: string, additionalQuantity: number): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        updatedItem = {
          ...item,
          remainingQuantity: item.remainingQuantity + additionalQuantity,
          totalStock: (item.totalStock || 0) + additionalQuantity,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  public updateMedicine(medicineId: string, updates: Partial<MedicineItem>): MedicineItem | null {
    const list = this.loadMedicines();
    let updatedItem: MedicineItem | null = null;

    const next = list.map((item) => {
      if (item.id === medicineId) {
        updatedItem = {
          ...item,
          ...updates,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveMedicines(next);
    }
    return updatedItem;
  }

  public addMedicine(newMedicine: Omit<MedicineItem, 'id'> | (Omit<MedicineItem, 'id' | 'frequency' | 'scheduleTimes' | 'currentDoseIndex' | 'nextDoseTime'> & Partial<Pick<MedicineItem, 'frequency' | 'scheduleTimes' | 'currentDoseIndex' | 'nextDoseTime'>>)): MedicineItem {
    const list = this.loadMedicines();
    const created: MedicineItem = {
      id: `med-${Date.now()}`,
      frequency: newMedicine.frequency || 'Once Daily',
      scheduleTimes: newMedicine.scheduleTimes || [newMedicine.scheduledTime || '08:00 AM'],
      currentDoseIndex: newMedicine.currentDoseIndex ?? 0,
      nextDoseTime: newMedicine.nextDoseTime || newMedicine.scheduledTime || '08:00 AM',
      ...newMedicine,
    };
    list.unshift(created);
    this.saveMedicines(list);
    return created;
  }

  public deleteMedicine(medicineId: string): boolean {
    const list = this.loadMedicines();
    const filtered = list.filter((item) => item.id !== medicineId);
    if (filtered.length !== list.length) {
      this.saveMedicines(filtered);
      return true;
    }
    return false;
  }
}

export const medicineService = new MedicineService();

if (typeof window !== 'undefined') {
  setInterval(() => {
    medicineService.checkDueSchedules();
  }, 10000);
}
