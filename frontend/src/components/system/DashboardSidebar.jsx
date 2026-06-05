import React from 'react';
import './DashboardSidebar.css';

export function DashboardSidebar({
  variant = 'admin', // 'admin' hoặc 'moderator' (hiện tại css chung nên variant chỉ dùng để đổi aria-label/text nếu cần)
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

  const c = {
    wrapper: `dash-sidebar ${isCollapsed ? 'dash-sidebar--collapsed' : ''}`,
    brand: 'dash-sidebar__brand',
    brandMark: 'dash-sidebar__brand-mark',
    brandText: 'dash-sidebar__brand-text', 
    brandTitle: 'dash-sidebar__brand-title',
    brandSub: 'dash-sidebar__brand-sub',
    nav: 'dash-sidebar__nav',
    link: 'dash-sidebar__link',
    linkActive: 'dash-sidebar__link--active',
    linkIco: 'dash-sidebar__link-ico',
    linkLabel: 'dash-sidebar__link-label',
    linkBadge: 'dash-sidebar__badge',
    foot: 'dash-sidebar__foot',
  };

  return (
    <aside className={c.wrapper} aria-label={isMod ? "Điều hướng điều hành" : "Điều hướng quản trị"}>
      <div className={c.brand}>
        <button
          type="button"
          className={c.brandMark}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          🌸
        </button>
        <div className={c.brandText}>
          <span className={c.brandTitle}>{brandTitle}</span>
          {isMod && brandSub && <span className={c.brandSub}>{brandSub}</span>}
        </div>
      </div>

      <nav className={c.nav}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${c.link} ${activeTab === t.id ? c.linkActive : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className={c.linkIco} aria-hidden>
              {t.icon}
            </span>
            <span className={c.linkLabel}>
              {t.id === 'system' && !isMod ? (
                 <span className="admin-dash__sidebar-link-text-nowrap">Hệ Thống</span>
              ) : t.id === 'suggestions' && !isMod ? (
                 'Đề xuất'
              ) : (
                 t.label
              )}
            </span>
            {t.badge != null && <span className={c.linkBadge}>{t.badge}</span>}
          </button>
        ))}
      </nav>

      <div className={c.foot}>
        {footerNode}
      </div>
    </aside>
  );
}
