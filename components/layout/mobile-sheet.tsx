type MobileSheetProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function MobileSheet({ open, title, description, onClose, children }: MobileSheetProps) {
  if (!open) return null;

  return (
    <>
      <button
        aria-label="Cerrar modal"
        className="sheet-backdrop"
        type="button"
        onClick={onClose}
      />
      <section aria-modal="true" className="sheet-panel" role="dialog">
        <div className="sheet-handle" />
        <header className="mb-6">
          <h2 className="screen-title text-[17px]">{title}</h2>
          <p className="screen-subtitle text-[13px]">{description}</p>
        </header>
        {children}
      </section>
    </>
  );
}
