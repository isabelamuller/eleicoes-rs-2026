function AreaSwitch({ active }) {
  return (
    <div className="area-navigation">
      <nav aria-label="Área do site" className="area-switch">
        <a
          aria-current={active === 'rs' ? 'page' : undefined}
          className={active === 'rs' ? 'is-active' : ''}
          href="/"
        >
          RS
        </a>
        <a
          aria-current={active === 'poa' ? 'page' : undefined}
          className={active === 'poa' ? 'is-active' : ''}
          href="/mapa-porto-alegre"
        >
          POA
        </a>
      </nav>
      <a className="documentation-link" href="/documentacao">
        Docs
        <svg
          aria-hidden="true"
          className="documentation-arrow"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      </a>
    </div>
  );
}

export default AreaSwitch;
