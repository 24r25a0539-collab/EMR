import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface AdminHospitalItem {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  icuBeds: number;
  isEmergencyActive: boolean;
  departmentsCount: number;
}

export const AdminHospitalsPage: React.FC = () => {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);

  const [hospitals, setHospitals] = useState<AdminHospitalItem[]>([
    {
      id: 'h-1',
      name: 'Apex Health City',
      code: 'APEX-HYD-01',
      city: 'Hyderabad',
      address: 'Road No. 72, Jubilee Hills, Hyderabad',
      phone: '040-23607777',
      emergencyPhone: '1066',
      icuBeds: 120,
      isEmergencyActive: true,
      departmentsCount: 24,
    },
    {
      id: 'h-2',
      name: 'Care Hospital',
      code: 'CARE-HYD-01',
      city: 'Hyderabad',
      address: 'Road No. 1, Banjara Hills, Hyderabad',
      phone: '040-30418888',
      emergencyPhone: '108',
      icuBeds: 85,
      isEmergencyActive: true,
      departmentsCount: 18,
    },
    {
      id: 'h-3',
      name: 'Max Super Speciality Hospital',
      code: 'MAX-HYD-01',
      city: 'Hyderabad',
      address: 'Financial District, Gachibowli, Hyderabad',
      phone: '040-44556677',
      emergencyPhone: '040-44556600',
      icuBeds: 60,
      isEmergencyActive: true,
      departmentsCount: 14,
    },
  ]);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [icuBeds, setIcuBeds] = useState('50');

  const handleAddHospital = (e: React.FormEvent) => {
    e.preventDefault();
    const newHosp: AdminHospitalItem = {
      id: `h-${Date.now()}`,
      name,
      code: code.toUpperCase() || 'HOSP-01',
      city,
      address,
      phone,
      emergencyPhone,
      icuBeds: Number(icuBeds),
      isEmergencyActive: true,
      departmentsCount: 10,
    };

    setHospitals([...hospitals, newHosp]);
    setShowAddModal(false);
    addToast('success', `Partner Hospital ${name} onboarded with active EMR node.`);
  };

  const toggleEmergency = (id: string) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isEmergencyActive: !h.isEmergencyActive } : h))
    );
    addToast('info', 'Hospital 24x7 emergency desk status updated.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <ScrollReveal direction="bottom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Institutional Node Network
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
              Partner Hospitals & Infrastructure
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Configure partner hospital organizations, ICU bed capacities, and 24x7 emergency trauma nodes.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 transition-all flex items-center gap-2 shadow-lg shadow-teal-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital Node</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Hospitals Table */}
      <ScrollReveal direction="bottom" delay={0.05}>
        <div className="bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#101012] border-b border-white/5 text-white/50 uppercase font-semibold text-[10px]">
                  <th className="py-3.5 px-6">Hospital Organization</th>
                  <th className="py-3.5 px-4">Node Code</th>
                  <th className="py-3.5 px-4">Address / City</th>
                  <th className="py-3.5 px-4">Capacity & Departments</th>
                  <th className="py-3.5 px-4">Emergency Status</th>
                  <th className="py-3.5 px-6 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {hosp.name}
                      <div className="text-[11px] text-white/40 font-normal mt-0.5">
                        Emergency: <span className="font-mono text-rose-400">{hosp.emergencyPhone}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-teal-400">{hosp.code}</td>

                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{hosp.city}</div>
                      <div className="text-[10px] text-white/40 truncate max-w-xs">{hosp.address}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-white/80">{hosp.icuBeds} Critical ICU Beds</div>
                      <div className="text-[10px] text-white/40">{hosp.departmentsCount} Clinical Departments</div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleEmergency(hosp.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                          hosp.isEmergencyActive
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {hosp.isEmergencyActive ? '24x7 ER Live' : 'ER Standby'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => addToast('info', `Configuring node ${hosp.code}`)}
                        className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* Add Hospital Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Onboard Healthcare Facility"
      >
        <form onSubmit={handleAddHospital} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              Hospital Organization Legal Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fortis Memorial Hospital"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                Node Identifier Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FORTIS-HYD-01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] font-mono text-cyan-400 uppercase outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              Complete Facility Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, Area, Sector, Pincode"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                24x7 Emergency Line *
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="1066 or direct desk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white font-mono outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                ICU Beds Capacity
              </label>
              <input
                type="number"
                value={icuBeds}
                onChange={(e) => setIcuBeds(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/70 font-semibold hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-md"
            >
              Onboard Hospital Node
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminHospitalsPage;
