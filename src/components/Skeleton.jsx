export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-surface-1 ${className}`} />
}

export function SkeletonHome() {
  return (
    <div className="flex flex-col gap-6">
      <div className="app-header">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-2"><SkeletonBlock className="w-20 h-4" /><SkeletonBlock className="w-28 h-3" /></div>
        </div>
        <SkeletonBlock className="w-28 h-7 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 pt-3"><SkeletonBlock className="w-40 h-3" /><SkeletonBlock className="w-56 h-7" /><SkeletonBlock className="w-48 h-4" /></div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="app-card flex items-center gap-3 p-5">
            <SkeletonBlock className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1"><SkeletonBlock className="w-2/3 h-4" /><SkeletonBlock className="w-1/3 h-3" /></div>
          </div>
        ))}
      </div>
      <SkeletonBlock className="w-full h-14 rounded-xl" />
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="flex flex-col gap-6">
      <div className="app-header">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-2"><SkeletonBlock className="w-24 h-3" /><SkeletonBlock className="w-32 h-4" /></div>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2"><SkeletonBlock className="w-24 h-3" /><SkeletonBlock className="w-full h-12 rounded-xl" /></div>
        ))}
        <SkeletonBlock className="w-full h-14 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonEstadisticas() {
  return (
    <div className="flex flex-col gap-6">
      <div className="app-header"><div className="flex items-center gap-3"><SkeletonBlock className="w-11 h-11 rounded-xl flex-shrink-0" /><div className="flex flex-col gap-2"><SkeletonBlock className="w-28 h-3" /><SkeletonBlock className="w-36 h-5" /></div></div></div>
      <div className="grid grid-cols-2 gap-2"><SkeletonBlock className="h-11 rounded-xl" /><SkeletonBlock className="h-11 rounded-xl" /></div>
      <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="w-20 h-9 rounded-full flex-shrink-0" />)}</div>
      <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-24 rounded-2xl" />)}</div>
      <SkeletonBlock className="h-40 rounded-2xl" />
    </div>
  )
}
