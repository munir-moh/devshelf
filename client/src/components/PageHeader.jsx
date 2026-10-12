export default function PageHeader({ title, action }) {
  return <div className="page-header"><h1>{title}</h1><div className="header-actions">{action}</div></div>;
}
