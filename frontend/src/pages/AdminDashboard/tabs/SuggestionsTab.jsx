import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAdminOverview } from '../../../hooks/useAdminOverview';
import { useAnimatedNumber } from '../../../hooks/useAnimatedNumber';

const Motion = motion;
const CONVERSION_TARGET_PERCENT = 8;

function pct(cur, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((cur / target) * 100));
}

function pickNum(ov, camel, pascal) {
  const v = ov?.[camel] ?? ov?.[pascal];
  return Number(v ?? 0);
}

export function SuggestionsTab() {
  const { ov, loading, err } = useAdminOverview();
  const reduceMotion = useReducedMotion();

  const conversion = useMemo(() => {
    const academy = pickNum(ov, 'academyUsers', 'AcademyUsers');
    const free = pickNum(ov, 'freeUsers', 'FreeUsers');
    const premium = pickNum(ov, 'premiumUsers', 'PremiumUsers');
    const rate = pickNum(ov, 'premiumConversionRatePercent', 'PremiumConversionRatePercent');
    const upgradesMonth = pickNum(ov, 'premiumUpgradesThisMonth', 'PremiumUpgradesThisMonth');
    const total = academy > 0 ? academy : Math.max(free + premium, 1);
    const upgradeTarget = Math.max(5, upgradesMonth + 5);
    return { academy, free, premium, rate, upgradesMonth, total, upgradeTarget };
  }, [ov]);

  const animFree = useAnimatedNumber(conversion.free, { duration: reduceMotion ? 0 : 400, reduceMotion });
  const animPremium = useAnimatedNumber(conversion.premium, { duration: reduceMotion ? 0 : 400, reduceMotion });
  const animRate = useAnimatedNumber(conversion.rate, { duration: reduceMotion ? 0 : 350, reduceMotion });
  const animUpgrades = useAnimatedNumber(conversion.upgradesMonth, { duration: reduceMotion ? 0 : 350, reduceMotion });

  const suggestionCards = useMemo(() => {
    const premium = conversion.premium;
    const free = conversion.free;
    const rate = conversion.rate;
    const retention = pickNum(ov, 'retentionRatePercent', 'RetentionRatePercent');
    const msg24 = pickNum(ov, 'messagesLast24Hours', 'MessagesLast24Hours');
    const new7 = pickNum(ov, 'newUsersLast7Days', 'NewUsersLast7Days');
    return [
      {
        tone: 'blue',
        tag: 'Chuyển đổi',
        title: 'Tăng chuyển đổi Free → Premium',
        body: `Hiện có ${free.toLocaleString('vi-VN')} tài khoản Free và ${premium.toLocaleString('vi-VN')} Premium (${rate}%). Nên đặt điểm nâng cấp ở cuối bài học có tỷ lệ hoàn thành cao.`,
      },
      {
        tone: 'amber',
        tag: 'Retention',
        title: 'Giữ chân học viên cũ',
        body: `Retention 30 ngày đang là ${retention}%. Nên kích hoạt chiến dịch nhắc học lại cho nhóm không đăng nhập trong 7 ngày.`,
      },
      {
        tone: 'violet',
        tag: 'Hoạt động',
        title: 'Tối ưu trải nghiệm chat và game',
        body: `Hệ thống ghi nhận ${msg24.toLocaleString('vi-VN')} tin nhắn trong 24h. Ưu tiên tối ưu tải phòng chat và bảng xếp hạng game vào giờ cao điểm.`,
      },
      {
        tone: 'emerald',
        tag: 'Tăng trưởng',
        title: 'Tập trung nhóm người dùng mới',
        body: `Có ${new7.toLocaleString('vi-VN')} tài khoản mới trong 7 ngày. Nên gửi onboarding 3 bước trong 24h đầu để tăng tỷ lệ quay lại.`,
      },
    ];
  }, [ov, conversion.free, conversion.premium, conversion.rate]);

  const listReveal = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: { staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: 0 },
      },
    }),
    [reduceMotion],
  );

  const itemRise = useMemo(
    () => ({
      hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    }),
    [reduceMotion],
  );

  const goalsReveal = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: { staggerChildren: reduceMotion ? 0 : 0.06, delayChildren: reduceMotion ? 0 : 0.08 },
      },
    }),
    [reduceMotion],
  );

  const goalBars = useMemo(
    () => [
      {
        key: 'free',
        label: 'Học viên Free',
        current: conversion.free,
        target: conversion.total,
        color: '#64748b',
        display: () => `${animFree.toLocaleString('vi-VN')} / ${conversion.total.toLocaleString('vi-VN')} người`,
      },
      {
        key: 'premium',
        label: 'Học viên Premium',
        current: conversion.premium,
        target: conversion.total,
        color: '#7c3aed',
        display: () => `${animPremium.toLocaleString('vi-VN')} / ${conversion.total.toLocaleString('vi-VN')} người`,
      },
      {
        key: 'conv',
        label: 'Tỷ lệ chuyển đổi',
        current: conversion.rate,
        target: CONVERSION_TARGET_PERCENT,
        color: '#ea580c',
        display: () => `${animRate}% / ${CONVERSION_TARGET_PERCENT}%`,
      },
      {
        key: 'upgrades',
        label: 'Nâng cấp Premium tháng này',
        current: conversion.upgradesMonth,
        target: conversion.upgradeTarget,
        color: '#8e031d',
        display: () => `${animUpgrades} / ${conversion.upgradeTarget} lượt`,
      },
    ],
    [conversion, animFree, animPremium, animRate, animUpgrades],
  );

  return (
    <div className="admin-dash__tab-inner">
      <Motion.div className="admin-dash__ai-hero" variants={itemRise} initial="hidden" animate="visible">
        <h2 className="admin-dash__ai-title">Đề xuất tối ưu hóa từ AI</h2>
        <p className="admin-dash__ai-desc">Phân tích dữ liệu thật từ API và gợi ý bốn hướng tối ưu doanh thu cùng trải nghiệm học viên.</p>
      </Motion.div>
      {err ? <div className="admin-users__alert">{err}</div> : null}
      {loading && !err ? <div className="admin-dash__card-sub">Đang tải dữ liệu chuyển đổi…</div> : null}

      <Motion.div className="admin-dash__suggest-grid" variants={listReveal} initial="hidden" animate="visible">
        {suggestionCards.map((c) => (
          <Motion.div key={c.title} className={`admin-dash__suggest-card admin-dash__suggest-card--${c.tone}`} variants={itemRise}>
            <span className="admin-dash__suggest-tag">{c.tag}</span>
            <h3 className="admin-dash__suggest-title">{c.title}</h3>
            <p className="admin-dash__suggest-body">{c.body}</p>
            <button type="button" className="admin-dash__suggest-link">
              Xem chi tiết →
            </button>
          </Motion.div>
        ))}
      </Motion.div>

      <Motion.div className="admin-dash__card admin-dash__card--goals" variants={itemRise} initial="hidden" animate="visible">
        <div className="admin-dash__goals-head">
          <div>
            <h3 className="admin-dash__card-title admin-dash__card-title--serif">Chuyển đổi Free → Premium</h3>
            <p className="admin-dash__card-sub">
              {loading
                ? 'Đang đồng bộ số liệu học viên và gói Premium…'
                : `Tổng ${conversion.total.toLocaleString('vi-VN')} học viên — dữ liệu lấy từ API admin.`}
            </p>
          </div>
        </div>
        <Motion.ul className="admin-dash__goal-list" variants={goalsReveal} initial="hidden" animate="visible">
          {goalBars.map((b, idx) => (
            <Motion.li key={b.key} variants={itemRise}>
              <div className="admin-dash__goal-row">
                <span>{b.label}</span>
                <strong>{loading ? '…' : b.display()}</strong>
              </div>
              <div className="admin-dash__goal-track">
                <Motion.div
                  className="admin-dash__goal-fill"
                  initial={reduceMotion ? { width: `${pct(b.current, b.target)}%` } : { width: '0%' }}
                  animate={{ width: loading ? '0%' : `${pct(b.current, b.target)}%` }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.95,
                    ease: [0.22, 1, 0.36, 1],
                    delay: reduceMotion ? 0 : 0.12 + idx * 0.1,
                  }}
                  style={{ background: b.color }}
                />
              </div>
              <span className="admin-dash__goal-pct">{loading ? '—' : `${pct(b.current, b.target)}%`}</span>
            </Motion.li>
          ))}
        </Motion.ul>
      </Motion.div>
    </div>
  );
}
