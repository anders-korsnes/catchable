import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PokeballIcon } from './PokeballIcon';

// Each tab is a vertical icon-over-label tile. Stacking lets the (very wide)
// pixel font sit on its own line at a smaller size, so all four tabs comfortably
// fit even on narrow phones. min-w-0 + truncate guards against accidental
// overflow if a label ever grows.
const getTabClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
    isActive ? 'bg-ink text-ink-invert shadow-sm' : 'text-ink-muted hover:text-ink hover:bg-bg',
  ].join(' ');

const TAB_LABEL_CLASS = 'pixel-text text-[8px] tracking-[0.12em] truncate';

/**
 * App layout: a centered, fixed-height "device" panel.
 *
 *   - Header and bottom nav are sticky (don't scroll).
 *   - The middle <main> takes the remaining height and scrolls internally
 *     so long pages (Pokédex, Settings) stay inside the modal frame.
 *   - The outer container uses `100dvh` so mobile browsers' dynamic toolbars
 *     don't push the modal off-screen.
 *
 * The element gets `id="app-modal"` so the catch animation can measure it
 * and choreograph the Poké Ball just outside the modal's right edge.
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-bg p-3 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.18]"
      />

      <div
        id="app-modal"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-device"
        style={{ height: 'min(820px, calc(100dvh - 24px))' }}
      >
        <header className="flex flex-none items-center justify-between border-b border-line bg-surface px-5 py-3">
          <div className="flex items-center gap-2">
            <PokeballIcon size={28} />
            <span className="pixel-text text-[18px]">CATCHABLE</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-ink-muted sm:inline">@{user.username}</span>
              <button
                onClick={handleLogout}
                className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-bg"
              >
                Sign out
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="focus-ring rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ink-invert"
            >
              Sign in
            </NavLink>
          )}
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        <nav
          aria-label="Primary"
          className="flex-none border-t border-line bg-surface/95 px-3 py-2 backdrop-blur"
        >
          <div className="mx-auto flex w-full items-stretch gap-1">
            <NavLink to="/" end className={getTabClassName}>
              <SwipeIcon size={16} />
              <span className={TAB_LABEL_CLASS}>SWIPE</span>
            </NavLink>
            <NavLink
              to="/liked"
              className={getTabClassName}
              data-testid="tab-liked"
              id="liked-tab-target"
            >
              <PokeballIcon size={16} />
              <span className={TAB_LABEL_CLASS}>DEX</span>
            </NavLink>
            <NavLink to="/achievements" className={getTabClassName} data-testid="tab-achievements">
              <TrophyIcon size={16} />
              <span className={TAB_LABEL_CLASS}>MEDALS</span>
            </NavLink>
            <NavLink to="/settings" className={getTabClassName}>
              <CogIcon size={16} />
              <span className={TAB_LABEL_CLASS}>SETUP</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
}

function SwipeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="flex-none">
      <rect
        x="6"
        y="3"
        width="12"
        height="16"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 21l3-2 3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}

function CogIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="flex-none">
      <path
        d="M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.4 19.6l1.6-1.6M18 6l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function TrophyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="flex-none">
      <path
        d="M7 4h10v3a5 5 0 0 1-10 0V4Z"
        fill="currentColor"
        fillOpacity="0.85"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M9 14h6v2H9zM10 16h4v3h-4zM8 19h8"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
