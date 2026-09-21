import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  BellRing,
  Check,
  RotateCcw,
  AlertTriangle,
  Package,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import {
  medicineService,
  MedicineItem,
  RefillAlert,
  DoseStatus,
} from '../../services/medicineService';
import { BackButton } from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export const PatientMedicinesPage: React.FC = () => {
  const { addToast } = useToast();
  const { t, localizeValue } = useLanguage();

  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [refillAlerts, setRefillAlerts] = useState<RefillAlert[]>([]);

  // Load and subscribe to medicineService updates + PostgreSQL sync
  useEffect(() => {
    const refresh = () => {
      setMedicines(medicineService.getAllMedicines());
      setRefillAlerts(medicineService.getRefillAlerts());
    };

    const syncWithBackend = async () => {
      try {
        const res = await api.getMedicines();
        if (res && res.medicines) {
          res.medicines.forEach((m: any) => {
            const current = medicineService.getAllMedicines();
            if (!current.some(c => c.id === m.id || c.name.toLowerCase() === m.medicineName.toLowerCase())) {
              medicineService.addMedicine({
                name: m.medicineName,
                dosage: m.dosage || '1 tablet',
                doseQuantity: 1,
                dailyRequiredQuantity: 1,
                frequency: m.frequency || 'Once daily',
                timingSlot: (m.timingSlot === 'AFTERNOON' ? 'Afternoon' : m.timingSlot === 'EVENING' ? 'Evening' : m.timingSlot === 'NIGHT' ? 'Night' : 'Morning'),
                scheduledTime: '08:00 AM',
                scheduleTimes: ['08:00 AM'],
                currentDoseIndex: 0,
                nextDoseTime: '08:00 AM',
                instructions: m.instructions || 'After meals with water',
                totalStock: 30,
                remainingQuantity: 30,
                unit: 'tablets',
                status: m.status === 'TAKEN' ? 'TAKEN' : 'UPCOMING',
                prescribedBy: 'Prescribed Medication',
              });
            }
          });
        }
      } catch (err) {
        console.error('Failed to sync medicines from backend:', err);
      }
      refresh();
    };

    refresh();
    syncWithBackend();
    const unsubscribe = medicineService.subscribe(refresh);
    return () => unsubscribe();
  }, []);

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MedicineItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('500 mg (1 tablet)');
  const [formDoseQty, setFormDoseQty] = useState(1);
  const [formDailyQty, setFormDailyQty] = useState(2);
  const [formTime, setFormTime] = useState('08:00 AM');
  const [formSlot, setFormSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning');
  const [formInstructions, setFormInstructions] = useState('After breakfast with water');
  const [formStock, setFormStock] = useState(30);

  // Handlers
  const handleToggleTaken = (item: MedicineItem) => {
    if (item.status === 'TAKEN') {
      medicineService.markDoseUpcoming(item.id);
      api.updateMedicineAction(item.id, 'ACTIVE').catch(() => {});
      addToast('info', `Marked ${item.name} as upcoming. Restored dose to stock.`);
    } else {
      medicineService.markDoseTaken(item.id);
      api.updateMedicineAction(item.id, 'TAKEN').catch(() => {});
      addToast(
        'success',
        `Dose logged for ${item.name}. Subtracted ${item.doseQuantity} from stock.`
      );
    }
  };

  const handleSnooze = (item: MedicineItem) => {
    medicineService.snoozeDose(item.id, 15);
    api.updateMedicineAction(item.id, 'SNOOZED').catch(() => {});
    addToast('info', `Snoozed ${item.name} reminder for 15 minutes.`);
  };

  const handleRefillStock = (medicineId: string, name: string) => {
    medicineService.refillStock(medicineId, 30);
    addToast('success', `Added +30 units to ${name} stock.`);
  };

  const handleOpenEdit = (item: MedicineItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDosage(item.dosage);
    setFormDoseQty(item.doseQuantity);
    setFormDailyQty(item.dailyRequiredQuantity);
    setFormTime(item.scheduledTime);
    setFormSlot(item.timingSlot);
    setFormInstructions(item.instructions);
    setFormStock(item.remainingQuantity);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formName.trim()) return;

    medicineService.updateMedicine(editingItem.id, {
      name: formName.trim(),
      dosage: formDosage.trim(),
      doseQuantity: Number(formDoseQty) || 1,
      dailyRequiredQuantity: Number(formDailyQty) || 1,
      scheduledTime: formTime.trim(),
      timingSlot: formSlot,
      instructions: formInstructions.trim(),
      remainingQuantity: Number(formStock) || 0,
    });

    addToast('success', `Updated reminder for ${formName}.`);
    setEditingItem(null);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    medicineService.addMedicine({
      name: formName.trim(),
      dosage: formDosage.trim() || '1 tablet',
      doseQuantity: Number(formDoseQty) || 1,
      dailyRequiredQuantity: Number(formDailyQty) || 1,
      frequency: formDailyQty > 1 ? `${formDailyQty} times daily` : 'Once daily',
      timingSlot: formSlot,
      scheduledTime: formTime.trim() || '08:00 AM',
      scheduleTimes: [formTime.trim() || '08:00 AM'],
      currentDoseIndex: 0,
      nextDoseTime: formTime.trim() || '08:00 AM',
      instructions: formInstructions.trim() || 'After meals with water',
      totalStock: Number(formStock) || 30,
      remainingQuantity: Number(formStock) || 30,
      unit: 'tablets',
      status: 'UPCOMING',
      prescribedBy: 'Self-Added Medication',
    });

    api.addPatientMedicine({
      medicineName: formName.trim(),
      dosage: formDosage.trim() || '1 tablet',
      frequency: formDailyQty > 1 ? `${formDailyQty} times daily` : 'Once daily',
      timingSlot: formSlot.toUpperCase(),
      instructions: formInstructions.trim() || 'After meals with water',
    }).catch(e => console.error('Sync medicine error:', e));

    setShowAddModal(false);
    setFormName('');
    addToast('success', `Added ${formName} to your medication schedule.`);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      medicineService.deleteMedicine(deletingId);
      addToast('info', 'Medicine reminder deleted.');
      setDeletingId(null);
    }
  };

  // Counts
  const takenCount = medicines.filter((m) => m.status === 'TAKEN').length;
  const upcomingCount = medicines.filter((m) => m.status === 'UPCOMING' || m.status === 'SNOOZED').length;
  const missedCount = medicines.filter((m) => m.status === 'MISSED').length;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-white">
      {/* Top Back Button */}
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
        <span className="text-xs font-mono text-white/40">
          Medication Protocol: Adherence & Refill Tracking
        </span>
      </div>

      {/* Top Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Smart Medication Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
              Prescription Schedule & Inventory
            </h1>
            <p className="text-xs sm:text-sm text-white/65 mt-1">
              Time-ordered medication schedule. Marking taken deducts doses and recalculates remaining days.
            </p>
          </div>

          <button
            onClick={() => {
              setFormName('');
              setFormDosage('500 mg (1 tablet)');
              setFormDoseQty(1);
              setFormDailyQty(2);
              setFormTime('08:00 AM');
              setFormSlot('Morning');
              setFormInstructions('After breakfast with water');
              setFormStock(30);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 self-start sm:self-auto cursor-pointer btn-interaction"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </ScrollReveal>

      {/* PROMINENT REFILL WARNING BANNER */}
      {refillAlerts.length > 0 && (
        <ScrollReveal direction="center" delay={0.04}>
          <div className="p-5 sm:p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                    Medicine Running Low (<span className="text-rose-400">Less Than 2 Days Remaining</span>)
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Strict threshold triggered: Current stock is insufficient for 48 hours of treatment. Refill immediately to maintain therapeutic adherence.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                {refillAlerts.length} Critical {refillAlerts.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {refillAlerts.map((alert) => (
                <div
                  key={alert.medicineId}
                  className="p-4 rounded-2xl bg-[#141416] border border-white/[0.08] shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-bold text-white text-xs">{alert.name}</span>
                    </div>
                    <p className="text-[11px] text-white/65">
                      <strong className="text-rose-400 font-bold">{alert.remainingQuantity} {alert.unit}</strong> remaining • Daily: {alert.dailyRequiredQuantity}/day
                    </p>
                    <p className="text-[11px] font-bold text-amber-300">
                      Treatment Left: <span className="underline decoration-rose-400">{alert.daysRemaining} days</span> (&lt; 2.0 days)
                    </p>
                  </div>

                  <button
                    onClick={() => handleRefillStock(alert.medicineId, alert.name)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-md flex-shrink-0 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Refill (+30)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Summary Score Bar */}
      <ScrollReveal direction="center" delay={0.06}>
        <div className="bg-[#101012] p-5 rounded-3xl border border-white/[0.08] shadow-2xl grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Taken Today
            </span>
            <p className="text-2xl font-bold text-emerald-300 mt-0.5">{takenCount}</p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Upcoming / Snoozed
            </span>
            <p className="text-2xl font-bold text-blue-300 mt-0.5">{upcomingCount}</p>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Missed
            </span>
            <p className="text-2xl font-bold text-rose-300 mt-0.5">{missedCount}</p>
          </div>
        </div>
      </ScrollReveal>

      {/* TODAY'S TIMELINE CONTAINER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40">
            Today's Schedule & Inventory
          </h2>
          <span className="text-xs text-white/40">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {medicines.length === 0 ? (
          <ScrollReveal direction="center">
            <div className="bg-[#101012] p-12 text-center rounded-3xl border border-white/[0.08] shadow-2xl">
              <Pill className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No medicines added</h4>
              <p className="text-xs text-white/40 mt-1">
                You do not have any active medication schedules or reminders configured.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication</span>
              </button>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollRevealGroup staggerDelay={0.07} alternateDirection={true} className="space-y-4">
            {medicines.map((med, index) => {
              const daysLeft = medicineService.calculateDaysRemaining(
                med.remainingQuantity,
                med.dailyRequiredQuantity
              );
              const isLow = medicineService.isRefillWarning(
                med.remainingQuantity,
                med.dailyRequiredQuantity
              );

              return (
                <PremiumCard
                  key={med.id}
                  accent="teal"
                  className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    med.status === 'TAKEN'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : med.status === 'MISSED'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : med.status === 'SNOOZED'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#101012] border-white/[0.08] shadow-2xl'
                  }`}
                >
                  {/* Left: Time + Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        med.status === 'TAKEN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : med.status === 'MISSED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : med.status === 'SNOOZED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      }`}
                    >
                      <Pill className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                          Task {med.taskNumber || index + 1}
                        </span>

                        <span className="font-mono text-xs font-bold text-white bg-[#18181B] px-2.5 py-0.5 rounded-md border border-white/[0.08]">
                          {med.scheduledTime}
                        </span>

                        <span className="text-[10px] font-bold text-white/80 bg-[#18181B] px-2 py-0.5 rounded-md border border-white/[0.08]">
                          {localizeValue(med.timingSlot, 'clinicalTerm')}
                        </span>

                        {/* Status Badges */}
                        {med.status === 'TAKEN' ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Taken ({med.lastTakenAt || 'Today'})
                          </span>
                        ) : med.status === 'MISSED' ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Missed
                          </span>
                        ) : med.status === 'SNOOZED' ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                            <BellRing className="w-3 h-3 text-amber-400" />
                            Snoozed ({med.snoozeUntil || '+15 min'})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-500/20">
                            <Clock className="w-3 h-3 text-blue-400" />
                            Upcoming
                          </span>
                        )}

                        {/* Low Stock Badge */}
                        {isLow ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Medicine Running Low (&lt; 2 Days)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                            {daysLeft} Days Stock
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white">{localizeValue(med.name, 'medicineName')}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/65">
                        <span className="font-semibold text-white">{localizeValue(med.dosage, 'clinicalTerm')}</span>
                        <span>•</span>
                        <span>{localizeValue(med.instructions, 'clinicalTerm')}</span>
                        {med.frequency && (
                          <>
                            <span>•</span>
                            <span className="text-teal-400 font-semibold">{localizeValue(med.frequency, 'clinicalTerm')}</span>
                          </>
                        )}
                        {med.nextDoseTime && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400 font-bold">Next: {med.nextDoseTime}</span>
                          </>
                        )}
                        {med.prescribedBy && (
                          <>
                            <span>•</span>
                            <span className="text-white/40 font-medium">{localizeValue(med.prescribedBy, 'doctorName')}</span>
                          </>
                        )}
                      </div>

                      {/* Stock & Treatment Calculation Details */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                        <span>Remaining: <strong className={isLow ? 'text-rose-400 font-bold' : 'text-white font-semibold'}>{med.remainingQuantity} {med.unit}</strong></span>
                        <span>•</span>
                        <span>Daily Requirement: <strong className="text-white font-semibold">{med.dailyRequiredQuantity} / day</strong></span>
                        <span>•</span>
                        <span>Days Left: <strong className={isLow ? 'text-rose-400 font-bold' : 'text-teal-400 font-semibold'}>{daysLeft} days</strong></span>
                      </div>

                      {med.status === 'TAKEN' && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <div className="flex flex-wrap items-center gap-4 text-white/80">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/40 font-medium">Last Taken:</span>
                              <strong className="font-bold text-white">{med.lastTakenScheduledTime || med.scheduledTime}</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/40 font-medium">Taken at:</span>
                              <strong className="font-bold text-emerald-400">{med.takenAtTime || 'Just now'}</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-teal-400 font-semibold">Next Dose:</span>
                              <strong className="font-extrabold text-teal-300">{med.nextDoseTime || 'Tomorrow'}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
                    {med.status === 'TAKEN' ? (
                      <>
                        <button
                          onClick={() => handleToggleTaken(med)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 bg-[#18181B] text-white/80 hover:bg-[#222226] border border-white/[0.08]"
                          title="Undo dose completion"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            medicineService.advanceToNextScheduledTime(med.id);
                            addToast('info', `Next scheduled time arrived for ${med.name}! Dose is now due.`);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Next scheduled time arrives"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Next Dose</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleTaken(med)}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(med)}
                          className="px-3 py-2 rounded-xl border border-white/[0.12] text-white/80 text-xs font-semibold hover:bg-white/[0.06] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Remind me later (+15 min)"
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-400" />
                          <span>Remind later</span>
                        </button>
                      </>
                    )}

                    {/* Quick Refill +30 */}
                    <button
                      onClick={() => handleRefillStock(med.id, med.name)}
                      className="px-3 py-2 rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Add 30 pills to stock"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>+30</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(med)}
                      className="p-2 rounded-xl border border-white/[0.12] text-white/80 hover:text-teal-400 hover:border-teal-400/40 hover:bg-teal-500/10 transition-colors cursor-pointer"
                      title="Edit Medication"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeletingId(med.id)}
                      className="p-2 rounded-xl border border-white/[0.12] text-white/40 hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </PremiumCard>
              );
            })}
          </ScrollRevealGroup>
        )}
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Medication Reminder"
      >
        <form onSubmit={handleAddReminder} className="space-y-4 text-xs text-white">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Metformin Hydrochloride"
              className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Scheduled Time *
              </label>
              <input
                type="text"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="e.g. 08:00 AM"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Timing Slot
              </label>
              <select
                value={formSlot}
                onChange={(e) => setFormSlot(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Dosage & Form *
              </label>
              <input
                type="text"
                value={formDosage}
                onChange={(e) => setFormDosage(e.target.value)}
                placeholder="e.g. 500 mg (1 tablet)"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Dose Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formDoseQty}
                onChange={(e) => setFormDoseQty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Daily Required
              </label>
              <input
                type="number"
                min="1"
                value={formDailyQty}
                onChange={(e) => setFormDailyQty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Current Stock (Pills/Units)
              </label>
              <input
                type="number"
                min="0"
                value={formStock}
                onChange={(e) => setFormStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Instructions
              </label>
              <input
                type="text"
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                placeholder="e.g. After food with water"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.12] text-white/80 hover:bg-white/[0.06] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold cursor-pointer btn-interaction"
            >
              Add Medication
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Reminder Modal */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title={`Edit Medication: ${editingItem.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs text-white">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Scheduled Time *
                </label>
                <input
                  type="text"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Timing Slot
                </label>
                <select
                  value={formSlot}
                  onChange={(e) => setFormSlot(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formDosage}
                  onChange={(e) => setFormDosage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Dose Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={formDoseQty}
                  onChange={(e) => setFormDoseQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Daily Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={formDailyQty}
                  onChange={(e) => setFormDailyQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Stock Units Remaining
                </label>
                <input
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Instructions
                </label>
                <input
                  type="text"
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#141416] text-white"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-white/[0.12] text-white/80 hover:bg-white/[0.06] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold cursor-pointer btn-interaction"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medicine Reminder"
        message="Are you sure you want to remove this medication reminder from your daily schedule?"
        confirmText="Delete Reminder"
        variant="danger"
      />
    </div>
  );
};
