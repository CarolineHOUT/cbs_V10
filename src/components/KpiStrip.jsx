export default function KpiStrip({ items = [] }) {
  return (
    <div className="kpi-strip compact">
      {items.map((item) => (
        <article
          key={item.label}
          className={`app-card kpi-card compact tone-${item.tone || 'blue'}${item.onClick ? ' clickable' : ''}`}
          onClick={item.onClick || undefined}
          role={item.onClick ? 'button' : undefined}
          tabIndex={item.onClick ? 0 : undefined}
          onKeyDown={item.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') item.onClick(); } : undefined}
        >
          <div className="kpi-card__label">{item.label}</div>
          <div className="kpi-card__value">{item.value}</div>
          <div className="kpi-card__detail">{item.detail}</div>
        </article>
      ))}
    </div>
  );
}
