import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => { const onKeyDown = (event) => event.key === 'Escape' && onClose(); window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">×</button></header>{children}</section></div>;
}
