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
        <div className="up-dropdown" ref={dropdownRef}>
            <div onClick={handleTriggerClick} className="up-trigger-wrap">
                {trigger}
            </div>
            {isOpen && (
                <div className="up-menu" role="menu" aria-orientation="vertical">
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
    const className = `up-menu-item ${danger ? 'up-menu-item--danger' : ''}`;

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

const DropdownMenuSeparator = () => <div className="up-menu-separator" />;

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
        <img className="up-avatar-img" src={avatarSrc} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
    ) : (
        <div className="up-avatar-fallback" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
            {initials}
        </div>
    );

    const headerAvatarContent = avatarSrc ? (
        <img className="up-avatar-img" src={avatarSrc} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
    ) : (
        <div className="up-avatar-fallback" style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
            {initials}
        </div>
    );

    return (
        <DropdownMenu isOpen={menuOpen} setIsOpen={setMenuOpen} trigger={
            <button type="button" className="up-trigger" aria-expanded={menuOpen} aria-haspopup="menu">
                <div className="up-trigger-avatar">
                    {avatarContent}
                </div>
                <div className="up-trigger-text">
                    <div className="up-trigger-name">
                        {displayName}
                    </div>
                    {email && (
                        <div className="up-trigger-email">
                            {email}
                        </div>
                    )}
                </div>
            </button>
        }>

            <div className="up-menu-group">
                <DropdownMenuItem to={ROUTES?.ACCOUNT || '/account'}>
                    <UserIcon className="up-menu-icon" />
                    Thông tin
                </DropdownMenuItem>
                <DropdownMenuItem to={ROUTES?.DASHBOARD || '/dashboard'}>
                    <LayoutDashboardIcon className="up-menu-icon" />
                    Bảng điều khiển
                </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />

            <div className="up-menu-group">
                <DropdownMenuItem onClick={logout}>
                    <LogOutIcon className="up-menu-icon" />
                    Đăng xuất
                </DropdownMenuItem>
            </div>
        </DropdownMenu>
    );
}