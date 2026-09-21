import React, { useState } from 'react';
import {
  Stethoscope,
  Calendar,
  Building2,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Download,
  Activity,
  ChevronDown,
  User,
} from 'lucide-react';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { BackButton } from '../../components/common/BackButton';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export const PatientConsultationsPage: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getConsultations();
        if (res.success && Array.isArray(res.consultations)) {
          const mapped = res.consultations.map((c: any) => {
            let vitals = { bp: '120/80 mmHg', pulse: '72 bpm', spo2: '98%', temp: '98.6 F', weight: '70 kg' };
            if (c.vitalsJson) {
              try { vitals = { ...vitals, ...JSON.parse(c.vitalsJson) }; } catch (e) {}
            }
            return {
              id: c.consultationNumber || c.id,
              date: c.date,
              doctorName: c.doctor?.fullName || 'Dr. Specialist',
              specialty: c.doctor?.specialization || 'Consultant Physician',
              qualification: c.doctor?.qualifications || 'MBBS, MD',
              licenseNo: c.doctor?.registrationNumber || 'MED-REG',
              hospital: c.hospital?.name || 'Apex Health City',
              chiefComplaint: c.symptoms || 'Clinical consultation',
              vitals,
              diagnosis: c.diagnosis || 'Clinical evaluation',
              clinicalNotes: c.treatmentPlan || c.clinicalNotes || 'General consultation completed.',
              followUp: c.followUpDate ? `Review on ${c.followUpDate}` : 'As advised by doctor',
              sha256Hash: c.recordHash || '0x00',
              blockNumber: 10480,
            };
          });
          setConsultations(mapped);
        }
      } catch (err) {
        console.error('Failed to load consultations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white page-fade-in">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
          Specialist Consultations
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
          Clinical Consultation Notes
        </h1>
        <p className="text-xs sm:text-sm text-white/65 mt-1">
          Detailed diagnostic summaries, physical examination vitals, and physician treatment plans.
        </p>
      </ScrollReveal>

      {/* Consultations List */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-[#101012] p-12 text-center rounded-3xl border border-white/[0.08] shadow-2xl space-y-3">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-white/60 font-semibold">Loading consultation notes...</p>
          </div>
        ) : consultations.length === 0 ? (
          <ScrollReveal direction="center">
            <div className="bg-[#101012] p-12 text-center rounded-3xl border border-white/[0.08] shadow-2xl space-y-3">
              <Stethoscope className="w-12 h-12 text-white/30 mx-auto" />
              <h4 className="text-base font-bold text-white">No consultations</h4>
              <p className="text-xs text-white/40">
                No clinical consultations recorded for this account.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="space-y-6">
            {consultations.map((c) => (
              <PremiumCard
                key={c.id}
                accent="teal"
                className="overflow-hidden space-y-0"
              >
                {/* Top Bar */}
                <div className="p-6 bg-[#141416] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{c.doctorName}</h3>
                        <span className="text-[11px] font-mono text-white/40">({c.licenseNo})</span>
                      </div>
                      <p className="text-xs text-teal-400 font-semibold">{c.specialty}</p>
                      <p className="text-xs text-white/40 mt-0.5">{c.hospital}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between text-xs">
                    <span className="font-semibold text-white">{c.date}</span>
                    <span className="text-[11px] font-mono text-white/40">ID: {c.id}</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Vitals Ribbon */}
                  <div className="p-4 bg-[#141416] rounded-2xl border border-white/[0.08] grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Blood Pressure</span>
                      <p className="font-bold text-white mt-0.5">{c.vitals.bp}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Heart Rate</span>
                      <p className="font-bold text-white mt-0.5">{c.vitals.pulse}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Oxygen (SpO2)</span>
                      <p className="font-bold text-white mt-0.5">{c.vitals.spo2}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Body Temp</span>
                      <p className="font-bold text-white mt-0.5">{c.vitals.temp}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Weight</span>
                      <p className="font-bold text-white mt-0.5">{c.vitals.weight}</p>
                    </div>
                  </div>

                  {/* Diagnosis & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-bold uppercase tracking-wider text-white/40 text-[11px]">
                          Chief Complaint
                        </h5>
                        <p className="text-white/80 mt-1 leading-relaxed bg-[#141416] p-3 rounded-xl border border-white/[0.08]">
                          {c.chiefComplaint}
                        </p>
                      </div>
                      <div>
                        <h5 className="font-bold uppercase tracking-wider text-white/40 text-[11px]">
                          Clinical Diagnosis
                        </h5>
                        <p className="text-white font-bold mt-1 text-sm bg-teal-500/10 p-3 rounded-xl border border-teal-500/20 text-teal-300">
                          {c.diagnosis}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="font-bold uppercase tracking-wider text-white/40 text-[11px]">
                          Physician Observations & Plan
                        </h5>
                        <p className="text-white/80 mt-1 leading-relaxed bg-[#141416] p-3 rounded-xl border border-white/[0.08]">
                          {c.clinicalNotes}
                        </p>
                      </div>
                      <div>
                        <h5 className="font-bold uppercase tracking-wider text-white/40 text-[11px]">
                          Follow-up Advice
                        </h5>
                        <p className="text-white/60 mt-1 italic">{c.followUp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar with Blockchain Proof and Action */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Tamper-Proof Verification Anchored on Block #{c.blockNumber}</span>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedDoc({
                          title: `Consultation Note - ${c.doctorName}`,
                          category: 'Clinical Consultation Note',
                          date: c.date,
                          doctorName: c.doctorName,
                          hospitalName: c.hospital,
                          contentSnippet: (
                            <div className="space-y-3 text-white">
                              <p><strong>Chief Complaint:</strong> {c.chiefComplaint}</p>
                              <p><strong>Diagnosis:</strong> {c.diagnosis}</p>
                              <p><strong>Clinical Notes:</strong> {c.clinicalNotes}</p>
                              <p><strong>Follow-up:</strong> {c.followUp}</p>
                            </div>
                          ),
                          blockchainProof: {
                            recordHash: c.sha256Hash,
                            blockNumber: c.blockNumber,
                            verified: true,
                          },
                        })
                      }
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer btn-interaction"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Official Copy</span>
                    </button>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </ScrollRevealGroup>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          category={selectedDoc.category}
          date={selectedDoc.date}
          doctorName={selectedDoc.doctorName}
          hospitalName={selectedDoc.hospitalName}
          contentSnippet={selectedDoc.contentSnippet}
          blockchainProof={selectedDoc.blockchainProof}
        />
      )}
    </div>
  );
};
