import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

// Menampilkan /Logo.png. Bila file belum ada, otomatis memakai ikon daun seperti sebelumnya.
export default function Logo({ className = 'w-9 h-9' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`${className} rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 grid place-items-center shadow-sm`}>
        <Leaf className="w-1/2 h-1/2 text-white" />
      </span>
    );
  }
  return (
    <img
      src={`${process.env.PUBLIC_URL}/Logo.png`}
      alt="WiwikSayur.com"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}