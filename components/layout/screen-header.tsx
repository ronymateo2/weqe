type ScreenHeaderProps = {
  title: string;
  description: string;
};

export function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <header className="mb-8">
      <p className="section-label">NeuroEye Log</p>
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">{description}</p>
    </header>
  );
}
