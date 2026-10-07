import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { formatRupiah } from '../lib/utils';
import { KG_PRESETS, lineTotal, fmtQty } from '../lib/qty';

export default function QtyPicker({ product, onAdd }) {
  const isKg = product.unit === 'kg';
  const [kg, setKg] = useState(0.5);
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState('g');
  const [pcs, setPcs] = useState(1);
  const soldOut = product.stock <= 0;

  const applyCustom = (v, m) => {
    setCustom(v);
    const n = parseFloat(String(v).replace(',', '.'));
    if (!isNaN(n) && n > 0) setKg(m === 'g' ? n / 1000 : n);
  };
  const addBtn = 'w-full h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50';

  if (!isKg) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center rounded-full border border-emerald-200 overflow-hidden">
          <button onClick={() => setPcs(Math.max(1, pcs - 1))} className="w-8 h-9 hover:bg-emerald-50">−</button>
          <span className="w-8 text-center font-mono text-sm">{pcs}</span>
          <button onClick={() => setPcs(pcs + 1)} className="w-8 h-9 hover:bg-emerald-50">+</button>
        </div>
        <button disabled={soldOut} onClick={() => onAdd(product, pcs)} className={`flex-1 ${addBtn}`}>+ Tambah</button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {KG_PRESETS.map((p) => (
          <button key={p.kg} onClick={() => { setKg(p.kg); setCustom(''); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${kg === p.kg && !custom ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input value={custom} onChange={(e) => applyCustom(e.target.value, mode)} inputMode="decimal"
          placeholder={mode === 'g' ? 'cth: 750' : 'cth: 1.5'}
          className="h-8 w-full min-w-0 rounded-md border border-emerald-200 px-2 text-xs bg-white" />
        <div className="flex rounded-full border border-emerald-200 overflow-hidden text-xs font-bold">
          {['g', 'kg'].map((m) => (
            <button key={m} onClick={() => { setMode(m); if (custom) applyCustom(custom, m); }}
              className={`px-2.5 h-8 ${mode === m ? 'bg-emerald-700 text-white' : 'text-emerald-800'}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{fmtQty(kg, 'kg')}</span>
        <span className="font-mono font-bold text-emerald-800">{formatRupiah(lineTotal(product.price, kg))}</span>
      </div>
      <button disabled={soldOut || kg < 0.1} onClick={() => onAdd(product, kg)} className={addBtn}>+ Tambah {fmtQty(kg, 'kg')}</button>
    </div>
  );
}
