

export function DashboardSidebar({
  variant = 'admin',
  isCollapsed,
  onToggleCollapse,
  brandTitle,
  brandSub,
  tabs,
  activeTab,
  onTabChange,
  footerNode
}) {
  const isMod = variant === 'moderator';

  return (
    <aside
      className={`flex-shrink-0 flex flex-col gap-3 pt-5 pb-4 px-4 min-h-full h-screen sticky top-0 overflow-x-hidden transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] box-border bg-gradient-to-b from-[#fffdfb] via-[#f8f2f4] to-[#f3eef5] text-[#3f2028] border-r border-[rgba(142,3,29,0.12)] shadow-[4px_0_24px_rgba(142,3,29,0.06)] dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 dark:border-r-slate-800 dark:shadow-[4px_0_28px_rgba(0,0,0,0.35)] max-[900px]:w-full max-[900px]:h-auto max-[900px]:relative max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:items-center max-[900px]:min-h-0 max-[900px]:p-4 max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:border-b-[rgba(142,3,29,0.12)] dark:max-[900px]:border-b-slate-800 ${isCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      aria-label={isMod ? "Điều hướng điều hành" : "Điều hướng quản trị"}
    >
      {/* Brand block */}
      <div className={`p-0 mb-2 flex items-center whitespace-nowrap gap-3 max-[900px]:flex-1 max-[900px]:min-w-[140px] ${isCollapsed ? 'min-[901px]:justify-center min-[901px]:gap-0' : ''
        }`}>
        <button
          type="button"
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgba(142,3,29,0.95)] to-rose-400 flex items-center justify-center text-[1.35rem] flex-shrink-0 mr-0 shadow-[0_8px_26px_rgba(0,0,0,0.25)] border-none cursor-pointer p-0 outline-none hover:scale-105 transition-transform duration-200"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          🌸
        </button>
        <div className={`flex flex-col min-w-0 transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'min-[901px]:max-w-0 min-[901px]:opacity-0 min-[901px]:invisible min-[901px]:pointer-events-none min-[901px]:overflow-hidden' : 'min-[901px]:max-w-[200px] min-[901px]:opacity-100'
          }`}>
          <span className="block text-[1.45rem] font-extrabold text-[#8e031d] dark:text-rose-200 tracking-normal leading-tight">{brandTitle}</span>
          {isMod && brandSub && (
            <span className="block mt-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{brandSub}</span>
          )}
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:w-full max-[900px]:max-h-none max-[900px]:gap-2 max-[900px]:mt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`flex relative items-center w-full h-12 px-3 gap-3 rounded-xl border border-transparent bg-transparent text-slate-600 dark:text-slate-400 text-sm font-semibold cursor-pointer whitespace-nowrap box-border transition-colors duration-150 hover:text-[#8e031d] dark:hover:text-slate-50 hover:bg-[rgba(142,3,29,0.05)] dark:hover:bg-white/5 dark:hover:border-rose-400/30 max-[900px]:flex-grow max-[900px]:flex-shrink max-[900px]:basis-[44%] max-[900px]:w-auto max-[900px]:justify-start ${activeTab === t.id
              ? 'bg-[rgba(142,3,29,0.1)] text-[#8e031d] border-transparent shadow-none dark:bg-gradient-to-r dark:from-[#8e031d] dark:to-red-700 dark:text-white dark:border-[rgba(142,3,29,0.35)] dark:shadow-[0_8px_22px_rgba(142,3,29,0.28)]'
              : ''
              } ${isCollapsed ? 'min-[901px]:gap-0 min-[901px]:justify-center min-[901px]:px-0' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center flex-shrink-0 text-[1.1rem] min-[901px]:mr-0" aria-hidden>
              {t.icon}
            </span>
            <span className={`flex-1 flex items-center justify-between gap-1.5 overflow-hidden text-ellipsis transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'min-[901px]:max-w-0 min-[901px]:opacity-0 min-[901px]:invisible min-[901px]:pointer-events-none min-[901px]:overflow-hidden' : 'min-[901px]:max-w-[200px] min-[901px]:opacity-100'
              } max-[900px]:opacity-100 max-[900px]:visible max-[900px]:static`}>
              {t.id === 'system' && !isMod ? (
                <span className="whitespace-nowrap">Hệ Thống</span>
              ) : t.id === 'suggestions' && !isMod ? (
                'Đề xuất'
              ) : (
                t.label
              )}
            </span>
            {t.badge != null && (
              <span className={`transition-[max-width,opacity] duration-300 z-10 ${isCollapsed
                ? 'min-[901px]:absolute min-[901px]:top-1 min-[901px]:right-0.5 min-[901px]:left-auto min-[901px]:min-w-[16px] min-[901px]:h-4 min-[901px]:px-1 min-[901px]:text-[9px] min-[901px]:font-extrabold min-[901px]:rounded-full min-[901px]:bg-[#8e031d] min-[901px]:text-white min-[901px]:shadow-md min-[901px]:border-[1.5px] min-[901px]:border-white dark:min-[901px]:border-slate-950 flex items-center justify-center'
                : 'flex-shrink-0 min-w-[1.35rem] h-[1.35rem] px-1.5 rounded-full text-[0.72rem] font-extrabold inline-flex items-center justify-center bg-[rgba(142,3,29,0.12)] text-[#8e031d] dark:text-rose-200 dark:bg-rose-400/20'
                }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer block */}
      <div className={`flex flex-col gap-2.5 pt-3 mt-auto border-t border-[rgba(142,3,29,0.1)] dark:border-t-slate-800 overflow-hidden max-[900px]:w-full max-[900px]:mt-2 max-[900px]:flex-row max-[900px]:items-center max-[900px]:justify-between ${isCollapsed ? 'min-[901px]:hidden' : ''
        }`}>
        {footerNode}
      </div>
    </aside>
  );
}
