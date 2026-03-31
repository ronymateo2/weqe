type ScreenHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
};

function getUserInitials(name: string | null | undefined) {
  if (!name) {
    return "U";
  }

  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "U";
  }

  const initials = tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

export function ScreenHeader({ title, description, action, user }: ScreenHeaderProps) {
  const shouldShowUserChip = Boolean(user?.name || user?.image);

  return (
    <header className="mb-8">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="section-label mb-0">NeuroEye Log</p>
        {!shouldShowUserChip ? action ?? null : null}
      </div>
      {shouldShowUserChip ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-h-12 flex-1 items-center gap-3 rounded-[var(--radius-full)] border border-[var(--info-border)] bg-[var(--info-bg)] px-3 py-2">
            {user?.image ? (
              <img
                alt={`Foto de ${user.name ?? "usuario"}`}
                className="h-8 w-8 rounded-full border border-[rgba(212,162,76,0.35)] object-cover"
                referrerPolicy="no-referrer"
                src={user.image}
              />
            ) : (
              <div className="mono flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(212,162,76,0.35)] bg-[var(--surface-el)] text-[11px] font-medium text-[var(--accent)]">
                {getUserInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-semibold tracking-[0.12em] text-[var(--text-faint)] uppercase">Sesion</p>
              <p className="m-0 truncate text-[13px] font-medium text-[var(--accent)]">{user?.name ?? "Usuario"}</p>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">{description}</p>
    </header>
  );
}
