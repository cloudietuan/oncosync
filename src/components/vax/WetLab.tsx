import { useState } from 'react';
import InfoTooltip from './InfoTooltip';
import type { Batch } from '@/data/gse62452';

interface WetLabProps {
  batches: Batch[];
  setBatches: (batches: Batch[]) => void;
}

const WetLab = ({ batches, setBatches }: WetLabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: '', date: '', volume: 1000, iptg: 1.0, hours: 4, sds: '', linker: 'SMPH', peptide: 'v3', notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBatches([...batches, { ...form, status: 'in_progress', gel: true } as Batch]);
    setShowForm(false);
    setForm({ id: '', date: '', volume: 1000, iptg: 1.0, hours: 4, sds: '', linker: 'SMPH', peptide: 'v3', notes: '' });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h2 className="vax-section-title flex items-center gap-2">
            Lab Records
            <InfoTooltip term="Lab Records" definition="Wet lab documentation of VLP (Virus-Like Particle) production batches, including expression conditions, purification steps, and conjugation parameters." />
          </h2>
          <p className="vax-section-desc">Qβ VLP production and conjugation tracking</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="vax-btn-primary shrink-0">
          {showForm ? 'Cancel' : '+ New Batch'}
        </button>
      </div>

      {showForm && (
        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Log New Batch</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="vax-label">Batch ID</label>
              <input className="vax-input" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="QB-2024-XXX" required />
            </div>
            <div>
              <label className="vax-label">Date</label>
              <input className="vax-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="vax-label">Volume (mL)</label>
              <input className="vax-input" type="number" value={form.volume} onChange={e => setForm({ ...form, volume: +e.target.value })} />
            </div>
            <div>
              <label className="vax-label">IPTG (mM)</label>
              <input className="vax-input" type="number" step="0.1" value={form.iptg} onChange={e => setForm({ ...form, iptg: +e.target.value })} />
            </div>
            <div>
              <label className="vax-label">Induction Time (hrs)</label>
              <input className="vax-input" type="number" value={form.hours} onChange={e => setForm({ ...form, hours: +e.target.value })} />
            </div>
            <div>
              <label className="vax-label">Linker</label>
              <select className="vax-input" value={form.linker} onChange={e => setForm({ ...form, linker: e.target.value })}>
                <option>SMPH</option><option>Sulfo-SMCC</option><option>LC-SMCC</option>
              </select>
            </div>
            <div>
              <label className="vax-label">Peptide Version</label>
              <select className="vax-input" value={form.peptide} onChange={e => setForm({ ...form, peptide: e.target.value })}>
                <option>v2</option><option>v3</option>
              </select>
            </div>
            <div>
              <label className="vax-label">SDS-PAGE (kDa)</label>
              <input className="vax-input" type="number" step="0.1" value={form.sds} onChange={e => setForm({ ...form, sds: e.target.value })} placeholder="~3.5" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="vax-label">Notes</label>
              <input className="vax-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observations..." />
            </div>
            <div className="flex items-end">
              <button type="submit" className="vax-btn-primary w-full">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="vax-card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Batch ID</th><th>Date</th><th>Volume</th><th>IPTG <InfoTooltip term="IPTG" definition="Isopropyl β-D-1-thiogalactopyranoside — a chemical inducer that triggers protein expression in E. coli bacteria carrying the VLP gene." /></th><th>Induction</th><th>Linker <InfoTooltip term="Linker" definition="A bifunctional crosslinker (e.g., SMPH) that chemically attaches the target antigen peptide to the surface of the VLP carrier." /></th><th>Peptide</th><th>SDS-PAGE <InfoTooltip term="SDS-PAGE" definition="Sodium Dodecyl Sulfate Polyacrylamide Gel Electrophoresis — a technique to verify protein size and confirm successful VLP-peptide conjugation." /></th><th>Status</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id}>
                <td className="font-medium">{b.id}</td>
                <td>{b.date}</td>
                <td>{b.volume} mL</td>
                <td>{b.iptg} mM</td>
                <td>{b.hours}h</td>
                <td>{b.linker}</td>
                <td><span className="vax-badge-violet">{b.peptide}</span></td>
                <td>{b.sds ? `${b.sds} kDa` : '—'}</td>
                <td><span className={b.status === 'completed' ? 'vax-badge-green' : 'vax-badge-amber'}>{b.status === 'completed' ? 'Completed' : 'In Progress'}</span></td>
                <td className="text-muted-foreground">{b.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="vax-card">
        <h3 className="font-semibold text-sm mb-4">Protocol Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1">1. Expression</div>
            <p className="text-xs text-muted-foreground">E. coli BL21(DE3) with IPTG induction at 18°C overnight</p>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1">2. Purification</div>
            <p className="text-xs text-muted-foreground">Ammonium sulfate precipitation + size exclusion chromatography</p>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1">3. Conjugation</div>
            <p className="text-xs text-muted-foreground">SMPH bifunctional linker + ApoC1 peptide coupling</p>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1">4. Quality Control</div>
            <p className="text-xs text-muted-foreground">SDS-PAGE, DLS sizing, endotoxin testing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WetLab;
