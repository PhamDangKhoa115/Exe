import { Edit3, Info, RefreshCw, X } from "lucide-react";
import "./GoogleWorkspaceActions.css";

export default function GoogleWorkspaceActions({ onEdit, onDetails, onSync, syncing = false, onClose }) {
  return <>
    {onEdit && <button type="button" onClick={() => { onClose(); onEdit(); }}><Edit3 size={16} />Edit Title / Type</button>}
    {onDetails && <button type="button" onClick={() => { onClose(); onDetails(); }}><Info size={16} />View Details</button>}
    {onSync && <button type="button" disabled={syncing} onClick={onSync}><RefreshCw size={16} />{syncing ? "Syncing..." : "Sync to Sheet"}</button>}
  </>;
}

function BackendValue({ value }) {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (["https:", "http:"].includes(url.protocol)) return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
    } catch { /* Non-URL backend values are displayed as text. */ }
    return value;
  }
  return <pre>{JSON.stringify(value, null, 2) ?? "null"}</pre>;
}

// Swagger declares an opaque object: render actual keys instead of assumed fields.
export function GoogleWorkspaceResultModal({ title, loading, data, error, onClose }) {
  return <div className="workspace-modal-backdrop" onMouseDown={onClose}>
    <section className="workspace-modal workspace-result-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
      <button type="button" className="workspace-modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
      <h2>{title}</h2>
      {loading ? <p role="status">Loading...</p> : error ? <p role="alert">{error}</p> : data && typeof data === "object" && !Array.isArray(data) ?
        <dl>{Object.entries(data).map(([key, value]) => <div key={key}><dt>{key}</dt><dd><BackendValue value={value} /></dd></div>)}</dl> : <BackendValue value={data} />}
      <div className="workspace-modal-actions"><button type="button" onClick={onClose}>Close</button></div>
    </section>
  </div>;
}
