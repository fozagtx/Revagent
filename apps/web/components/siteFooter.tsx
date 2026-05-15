export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[rgba(189,215,255,0.5)]">
      <div className="container-page py-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="font-serif text-lg text-navy">RevAgent</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
