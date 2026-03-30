import { useMemo, useState } from "react";

function formatStatus(resource) {
  if (resource.requestStatus === "accepted") return "Acceptée";
  if (resource.requestStatus === "sent") return "En attente";
  if (resource.requestStatus === "draft") return "Brouillon";
  if (resource.requestStatus === "refused") return `Refusée · ${resource.refusalReason || "motif"}`;
  if (resource.explorationStatus === "reviewed") return "Analysée";
  if (resource.explorationStatus === "selected") return "Retenue";
  return "À analyser";
}

function toneFor(resource) {
  if (resource.requestStatus === "accepted") return { background: "#edf8f2", color: "#237a53", border: "#c8e8d3" };
  if (resource.requestStatus === "refused") return { background: "#fff1f0", color: "#b42318", border: "#f3c7c1" };
  if (resource.requestStatus === "sent" || resource.requestStatus === "draft") return { background: "#eef4ff", color: "#1d4b8f", border: "#d6e4ff" };
  return { background: "#fff8e8", color: "#9a6700", border: "#f6df9b" };
}

export default function ResourcePanel({
  resources,
  search,
  onSearchChange,
  radiusKm,
  onRadiusChange,
  onAddToPlan,
  onFollowResource,
  onSendRequest,
  onAcceptResource,
  onRefuseResource,
  refusalReasons = [],
}) {
  const [openRefusalId, setOpenRefusalId] = useState(null);
  const [refusalDrafts, setRefusalDrafts] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const sortedResources = useMemo(() => resources || [], [resources]);

  return (
    <section style={panel}>
      <div style={header}>
        <div>
          <div style={eyebrow}>Ressources terrain</div>
          <h2 style={title}>Qui j'appelle, quand, et avec quel support</h2>
        </div>
      </div>

      <div style={filters}>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher une ressource, un mot-clé, un contact..."
          style={input}
        />
        <div style={sliderWrap}>
          <span style={sliderLabel}>Rayon ≤ {radiusKm} km</span>
          <input type="range" min="5" max="50" step="5" value={radiusKm} onChange={(event) => onRadiusChange(Number(event.target.value))} />
        </div>
      </div>

      <div style={list}>
        {sortedResources.length === 0 ? (
          <div style={emptyState}>Aucune ressource utile pour ce rayon.</div>
        ) : (
          sortedResources.map((resource) => {
            const tone = toneFor(resource);
            const refusalValue = refusalDrafts[resource.id] || refusalReasons[0] || "Profil non compatible";
            const refusalOpen = openRefusalId === resource.id;
            const isExpanded = expandedId === resource.id;
            return (
              <div key={resource.id} style={resourceBlock}>
                <div style={resourceRow}>
                  <button
                    type="button"
                    style={resourceMainButton}
                    onClick={() => {
                      onFollowResource(resource.id);
                      setExpandedId(isExpanded ? null : resource.id);
                    }}
                  >
                    <div style={resourceHeaderLine}>
                      <div style={resourceName}>{resource.name}</div>
                      <span style={{ ...statusChip, background: tone.background, color: tone.color, borderColor: tone.border }}>
                        {formatStatus(resource)}
                      </span>
                    </div>
                    <div style={resourceMeta}>{resource.type} · {resource.territory} · {resource.km} km · {resource.form}</div>
                    <div style={resourceContactLine}>
                      <span>{resource.contactPerson || resource.contact || "Contact à préciser"}</span>
                      <span>·</span>
                      <span>{resource.bestTimeToCall || "joignable en journée"}</span>
                    </div>
                  </button>
                  <div style={actionRail}>
                    <button style={tinyBtn} onClick={() => onSendRequest(resource.id)}>Envoyer</button>
                    <button style={tinyPrimaryBtn} onClick={() => onAddToPlan(resource)}>Parcours</button>
                  </div>
                </div>

                {isExpanded ? (
                  <div style={expandedRow}>
                    <div style={contactGrid}>
                      <a href={`tel:${String(resource.phone || '').replace(/\s+/g, '')}`} style={linkChip}>📞 {resource.phone || "Téléphone"}</a>
                      <a href={`mailto:${resource.email || ''}`} style={linkChip}>✉ {resource.email || "Email"}</a>
                      <span style={softChip}>Moment utile : {resource.bestTimeToCall || "non renseigné"}</span>
                      <span style={softChip}>Conseil équipe : {resource.tips || resource.note || "Aucune note terrain"}</span>
                    </div>
                    <div style={secondaryActions}>
                      <button style={tinyBtn} onClick={() => onAcceptResource(resource.id)}>Accepter</button>
                      <button style={tinyDangerBtn} onClick={() => setOpenRefusalId(refusalOpen ? null : resource.id)}>Refus</button>
                    </div>
                  </div>
                ) : null}

                {refusalOpen ? (
                  <div style={refusalRow}>
                    <select
                      value={refusalValue}
                      onChange={(event) => setRefusalDrafts((prev) => ({ ...prev, [resource.id]: event.target.value }))}
                      style={select}
                    >
                      {refusalReasons.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                    <button
                      style={tinyDangerBtn}
                      onClick={() => {
                        onRefuseResource(resource.id, refusalValue);
                        setOpenRefusalId(null);
                      }}
                    >
                      Valider refus
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

const panel = { background: "#fff", border: "1px solid #dbe4f0", borderRadius: 12, padding: 10, display: "grid", gap: 8 };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };
const eyebrow = { fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 };
const title = { margin: 0, fontSize: 15, fontWeight: 900, color: "#17376a" };
const filters = { display: "grid", gap: 6, border: "1px solid #e8eef7", borderRadius: 10, padding: 8, background: "#fbfdff" };
const sliderWrap = { display: "grid", gap: 2 };
const sliderLabel = { fontSize: 11, fontWeight: 700, color: "#17376a" };
const input = { height: 30, borderRadius: 10, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12 };
const list = { display: "grid", gap: 6 };
const resourceBlock = { border: "1px solid #e8eef7", borderRadius: 10, background: "#fff" };
const resourceRow = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start", padding: 8 };
const resourceMainButton = { border: "none", background: "transparent", padding: 0, textAlign: "left", display: "grid", gap: 3, cursor: "pointer" };
const resourceHeaderLine = { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" };
const resourceName = { fontSize: 13, fontWeight: 900, color: "#17376a" };
const resourceMeta = { fontSize: 11, color: "#64748b" };
const resourceContactLine = { display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11, color: "#475569" };
const actionRail = { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" };
const statusChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, border: "1px solid transparent", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
const expandedRow = { display: "grid", gap: 8, padding: "0 8px 8px" };
const contactGrid = { display: "flex", gap: 6, flexWrap: "wrap" };
const linkChip = { minHeight: 24, padding: "0 8px", borderRadius: 999, border: "1px solid #d6e4ff", background: "#eef4ff", color: "#1d4b8f", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", textDecoration: "none" };
const softChip = { minHeight: 24, padding: "0 8px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 11, display: "inline-flex", alignItems: "center" };
const secondaryActions = { display: "flex", gap: 6, flexWrap: "wrap" };
const refusalRow = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 6, padding: "0 8px 8px" };
const select = { height: 30, borderRadius: 10, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12 };
const tinyBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const tinyPrimaryBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #17376a", background: "#17376a", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const tinyDangerBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #f3c7c1", background: "#fff1f0", color: "#b42318", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const emptyState = { border: "1px dashed #d2dceb", borderRadius: 10, padding: 10, fontSize: 12, color: "#64748b" };
