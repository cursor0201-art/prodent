import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 h-full w-full flex items-center justify-center bg-slate-50 min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm animate-pulse tracking-wide uppercase">
          Загрузка раздела...
        </p>
      </div>
    </div>
  );
}
