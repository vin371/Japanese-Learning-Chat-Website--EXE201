import { AUTH_HERO_LEARNER_AVATAR_URLS } from '../../data/homepageContent';

/** Ba avatar học viên mẫu (đồng bộ footer) cho pill “Joined by 12,000+ learners”. */
export function AuthHeroAvatars() {
  return (
    <div className="flex items-center -space-x-2.5">
      {AUTH_HERO_LEARNER_AVATAR_URLS.map((src) => (
        <span key={src} className="w-[34px] h-[34px] rounded-full bg-slate-300 border-2 border-white/95 shadow-md overflow-hidden inline-flex flex-shrink-0">
          <img src={src} alt="" width={34} height={34} className="w-full h-full object-cover block" loading="lazy" decoding="async" />
        </span>
      ))}
    </div>
  );
}
