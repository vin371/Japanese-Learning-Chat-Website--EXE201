"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface UserProfileDropdownProps {
    displayName: string;
    avatarSrc: string | null;
    initials: string;
    showPremiumBadge: boolean;
    accountTo: string;
}

export default function UserProfileDropdown({
    displayName,
    avatarSrc,
    initials,
    showPremiumBadge,
    accountTo,
}: UserProfileDropdownProps) {
    const avatarContent = avatarSrc ? (
        <img className="w-full h-full object-cover rounded-full" src={avatarSrc} alt="" />
    ) : (
        <div className="w-full h-full flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
            {initials}
        </div>
    );

    return (
        <Link
            to={accountTo}
            className={`yume-nav-profile-trigger flex items-center p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 transition-all outline-none no-underline${showPremiumBadge ? ' yume-nav-profile-trigger--premium' : ''}`}
            aria-label={displayName ? `Thông tin cá nhân — ${displayName}` : 'Thông tin cá nhân'}
        >
            <div className={`yume-nav-avatar-wrap${showPremiumBadge ? ' yume-nav-avatar-wrap--premium' : ''}`}>
                <div className="yume-nav-avatar-inner w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {avatarContent}
                </div>
                {showPremiumBadge ? (
                    <span className="yume-nav-avatar-premium" title="Tài khoản Premium" aria-label="Premium">
                        <Star size={11} fill="currentColor" strokeWidth={0} />
                    </span>
                ) : null}
            </div>
        </Link>
    );
}
