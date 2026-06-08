"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LayoutDashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
);

const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);

const DropdownMenu = ({
    children,
    trigger,
    isOpen,
    setIsOpen
}: {
    children: ReactNode;
    trigger: ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !(dropdownRef.current as HTMLElement).contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setIsOpen]);

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={handleTriggerClick} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 overflow-hidden pb-2" role="menu" aria-orientation="vertical">
                    <div onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const DropdownMenuItem = ({
    children,
    onClick,
    to,
    danger = false
}: {
    children: ReactNode;
    onClick?: () => void;
    to?: string;
    danger?: boolean;
}) => {
    const className = `w-full flex items-center px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ${
        danger ? 'hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400' : ''
    }`;

    if (to) {
        return (
            <Link to={to} onClick={onClick} className={className} role="menuitem">
                {children}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className} role="menuitem">
            {children}
        </button>
    );
};

const DropdownMenuSeparator = () => <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1.5" />;

interface UserProfileDropdownProps {
    user: any;
    displayName: string;
    avatarSrc: string | null;
    initials: string;
    showPremiumBadge: boolean;
    logout: () => void;
    ROUTES: any;
    menuOpen: boolean;
    setMenuOpen: (isOpen: boolean) => void;
}

export default function UserProfileDropdown({
    user,
    displayName,
    avatarSrc,
    initials,
    showPremiumBadge,
    logout,
    ROUTES,
    menuOpen,
    setMenuOpen
}: UserProfileDropdownProps) {
    const email = user?.email || '';

    const avatarContent = avatarSrc ? (
        <img className="w-full h-full object-cover rounded-full" src={avatarSrc} alt="" />
    ) : (
        <div className="w-full h-full flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
            {initials}
        </div>
    );

    return (
        <DropdownMenu isOpen={menuOpen} setIsOpen={setMenuOpen} trigger={
            <button type="button" className="flex items-center gap-3 py-1.5 pl-1.5 pr-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 transition-all outline-none" aria-expanded={menuOpen} aria-haspopup="menu">
                <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {avatarContent}
                </div>
                <div className="hidden md:flex flex-col items-start text-left min-w-0">
                    <div className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100 whitespace-nowrap truncate max-w-[120px]">
                        {displayName}
                    </div>
                    {email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5 whitespace-nowrap truncate max-w-[140px]">
                            {email}
                        </div>
                    )}
                </div>
            </button>
        }>
            <div className="p-1.5 flex flex-col gap-0.5">
                <DropdownMenuItem to={ROUTES?.ACCOUNT || '/account'}>
                    <UserIcon className="mr-2.5 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                    Thông tin
                </DropdownMenuItem>
                <DropdownMenuItem to={ROUTES?.DASHBOARD || '/dashboard'}>
                    <LayoutDashboardIcon className="mr-2.5 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                    Bảng điều khiển
                </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />

            <div className="p-1.5">
                <DropdownMenuItem onClick={logout} danger>
                    <LogOutIcon className="mr-2.5 w-4.5 h-4.5 text-red-500 dark:text-red-400" />
                    Đăng xuất
                </DropdownMenuItem>
            </div>
        </DropdownMenu>
    );
}