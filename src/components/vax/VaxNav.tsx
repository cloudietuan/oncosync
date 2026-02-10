interface VaxNavProps {
  tab: number;
  setTab: (tab: number) => void;
}

const tabs = ['Overview', 'Lab Records', 'Analysis', 'Simulation', 'Safety', 'Export'];

const VaxNav = ({ tab, setTab }: VaxNavProps) => (
  <nav className="bg-card border-b border-border sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-6 flex">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => setTab(i)}
          className={`vax-nav-tab ${tab === i ? 'active' : ''}`}
          aria-current={tab === i ? 'page' : undefined}
        >
          {t}
        </button>
      ))}
    </div>
  </nav>
);

export default VaxNav;
