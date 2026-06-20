"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Star, User } from "lucide-react";

interface UserProfileDropdownProps {
    displayName: string;
    avatarSrc: string | null;
    initials: string;
    showPremiumBadge: boolean;
    accountTo: string;
    onLogout: () => void;
}

export default function UserProfileDropdown({
    displayName,
    avatarSrc,
    initials,
    showPremiumBadge,
    accountTo,
    onLogout,
}: UserProfileDropdownProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        function onDocMouseDown(e: MouseEvent) {
            const el = wrapRef.current;
            if (!el || el.contains(e.target as Node)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const avatarContent = avatarSrc ? (
        <img className="w-full h-full object-cover rounded-full" src={avatarSrc} alt="" />
    ) : (
        <div className="w-full h-full flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
            {initials}
        </div>
    );

    return (
        <div className="relative inline-block text-left" ref={wrapRef}>
            <button
                type="button"
                className={`yume-nav-profile-trigger flex items-center p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 transition-all outline-none cursor-pointer${showPremiumBadge ? " yume-nav-profile-trigger--premium" : ""}`}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={displayName ? `Tài khoản — ${displayName}` : "Tài khoản"}
                onClick={() => setOpen((v) => !v)}
            >
                <div className={`yume-nav-avatar-wrap${showPremiumBadge ? " yume-nav-avatar-wrap--premium" : ""}`}>
                    <div className="yume-nav-avatar-inner w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        {avatarContent}
                    </div>
                    {showPremiumBadge ? (
                        <span className="yume-nav-avatar-premium" title="Tài khoản Premium" aria-label="Premium">
                            <Star size={11} fill="currentColor" strokeWidth={0} />
                        </span>
                    ) : null}
                </div>
            </button>

            {open ? (
                <div
                    className="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[120] overflow-hidden py-1.5"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <Link
                        to={accountTo}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors no-underline"
                        onClick={() => setOpen(false)}
                    >
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden />
                        Thông tin cá nhân
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" role="separator" />
                    <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-none bg-transparent cursor-pointer text-left"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                    >
                        <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                        Đăng xuất
                    </button>
                </div>
            ) : null}
        </div>
    );
}
