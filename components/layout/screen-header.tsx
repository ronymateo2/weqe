type ScreenHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function ScreenHeader({ title, description, action }: ScreenHeaderProps) {
  return (
    <header className="mb-8">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="section-label mb-0">NeuroEye Log</p>
        {action ?? null}
      </div>
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">{description}</p>
    </header>
  );
}
