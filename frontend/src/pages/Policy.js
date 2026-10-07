import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { POLICIES, STORE } from '../data/policies';

// Halaman kebijakan. Isi ada di src/data/policies.js, data toko di STORE (satu tempat).
export default function Policy({ slug }) {
  const page = POLICIES[slug];
  useEffect(() => { window.scrollTo(0, 0); document.title = `${page.title} | Wiwiksayur.com`; }, [page]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-emerald-800">{page.title}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Terakhir diperbarui: {STORE.updated}</p>
      {page.intro && <p className="text-gray-700 mb-4">{page.intro}</p>}
      {page.sections.map((s) => (
        <section key={s.h} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.h}</h2>
          {s.p && <p className="text-gray-700 leading-relaxed">{s.p}</p>}
          {s.ul && (
            <ul className="list-disc pl-6 space-y-1 text-gray-700 leading-relaxed">
              {s.ul.map((li) => <li key={li}>{li}</li>)}
            </ul>
          )}
        </section>
      ))}
      <div className="mt-10 pt-4 border-t text-sm flex flex-wrap gap-4">
        {Object.entries(POLICIES).filter(([k]) => k !== slug).map(([k, v]) => (
          <Link key={k} to={`/${k}`} className="text-emerald-700 hover:underline">{v.title}</Link>
        ))}
      </div>
    </div>
  );
}
