import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getApiError } from '../api/client';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback';

const entityCopy = {
  resources: { singular: 'resource', action: 'Save resource' },
  snippets: { singular: 'snippet', action: 'Save snippet' },
  tasks: { singular: 'task', action: 'Add task' },
};

function RecordModal({ kind, item, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (kind === 'resources') return { title: item?.title || '', url: item?.url || '', notes: item?.notes || '', type: item?.type || 'docs' };
    if (kind === 'snippets') return { title: item?.title || '', description: item?.description || '', code: item?.code || '', language: item?.language || 'javascript', tags: item?.tags || '' };
    return { title: item?.title || '', description: item?.description || '', status: item?.status || 'todo', priority: item?.priority || 'medium', project: item?.project || '', dueDate: item?.dueDate ? item.dueDate.slice(0, 10) : '' };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (kind === 'resources') {
      let protocol = '';
      try { protocol = new URL(form.url).protocol; } catch { /* Let the form show the same validation message. */ }
      if (!['http:', 'https:'].includes(protocol)) { setError('Use a valid http:// or https:// link.'); return; }
    }
    setSaving(true);
    try {
      const payload = kind === 'tasks' ? { ...form, dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : null } : form;
      await onSave(payload);
      onClose();
    } catch (err) { setError(getApiError(err, 'Could not save your changes.')); }
    finally { setSaving(false); }
  };
  const copy = entityCopy[kind];
  return <Modal title={(item ? 'Edit ' : 'Add ') + copy.singular} onClose={onClose}>
    <form className="form-stack modal-form" onSubmit={submit}>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <label className="field"><span>{kind === 'tasks' ? 'Task title' : kind === 'snippets' ? 'Snippet name' : 'Resource title'}</span><input autoFocus required maxLength="160" value={form.title} onChange={set('title')} /></label>
      {kind === 'resources' && <><label className="field"><span>URL</span><input type="url" required value={form.url} onChange={set('url')} /></label><div className="form-grid"><label className="field"><span>Category</span><select value={form.type} onChange={set('type')}><option value="docs">Documentation</option><option value="article">Article</option><option value="video">Video</option><option value="tool">Tool</option><option value="other">Other</option></select></label><label className="field"><span>Notes (optional)</span><input maxLength="500" value={form.notes} onChange={set('notes')} /></label></div></>}
      {kind === 'snippets' && <><div className="form-grid"><label className="field"><span>Language</span><select value={form.language} onChange={set('language')}><option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="csharp">C#</option><option value="python">Python</option><option value="sql">SQL</option><option value="plaintext">Plain text</option></select></label><label className="field"><span>Description (optional)</span><input maxLength="300" value={form.description} onChange={set('description')} /></label></div><label className="field"><span>Code</span><textarea className="code-input" required rows="8" value={form.code} onChange={set('code')} /></label><label className="field"><span>Tags (comma-separated)</span><input maxLength="200" value={form.tags} onChange={set('tags')} /></label></>}
      {kind === 'tasks' && <><label className="field"><span>Description (optional)</span><textarea rows="3" maxLength="1000" value={form.description} onChange={set('description')} /></label><div className="form-grid form-grid-three"><label className="field"><span>Status</span><select value={form.status} onChange={set('status')}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label><label className="field"><span>Priority</span><select value={form.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="field"><span>Due date (optional)</span><input type="date" value={form.dueDate} onChange={set('dueDate')} /></label></div><label className="field"><span>Project (optional)</span><input maxLength="120" value={form.project} onChange={set('project')} /></label></>}
      <div className="modal-footer"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : item ? 'Save changes' : copy.action}<span>↗</span></button></div>
    </form>
  </Modal>;
}

function ConfirmDelete({ item, label, onClose, onConfirm, loading }) {
  return <Modal title={'Delete ' + item.title + '?'} onClose={onClose}><div className="modal-footer"><button className="button button-quiet" onClick={onClose} disabled={loading}>Cancel</button><button className="button button-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting…' : 'Delete ' + label}</button></div></Modal>;
}

function useCollection(path, label) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get(path); setItems(data); }
    catch (err) { setError(getApiError(err, 'Could not load your ' + label + '.')); }
    finally { setLoading(false); }
  }, [path, label]);
  useEffect(() => { load(); }, [load]);
  const save = async (item, payload) => {
    const { data } = item ? await api.put(path + '/' + item.id, payload) : await api.post(path, payload);
    setItems((current) => item ? current.map((existing) => existing.id === item.id ? data : existing) : [data, ...current]);
  };
  const remove = async (item) => { await api.delete(path + '/' + item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); };
  return { items, setItems, loading, error, load, save, remove };
}

function SearchBox({ value, onChange, placeholder = 'Search your shelf' }) {
  return <label className="search-box"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button type="button" onClick={() => onChange('')} aria-label="Clear search">×</button>}</label>;
}

function ResourceCard({ item, onEdit, onDelete }) {
  let safeUrl = '';
  try { const parsed = new URL(item.url); if (['http:', 'https:'].includes(parsed.protocol)) safeUrl = parsed.href; } catch { /* A malformed legacy URL stays as plain text. */ }
  return <article className="resource-card"><div className="resource-card-top"><span className="category-pill">{item.type || 'resource'}</span><div className="card-actions"><button className="card-action-button" onClick={onEdit}>Edit</button><button className="card-action-button delete-action" onClick={onDelete}>Delete</button></div></div><h3>{safeUrl ? <a href={safeUrl} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</h3>{item.notes && <p className="card-description">{item.notes}</p>}<div className="resource-card-footer">{safeUrl && <a href={safeUrl} target="_blank" rel="noreferrer">Open link</a>}</div></article>;
}

export function ResourcesPage() {
  const data = useCollection('/resources', 'resources');
  const [query, setQuery] = useState(''); const [editing, setEditing] = useState(undefined); const [deleting, setDeleting] = useState(null); const [deletingNow, setDeletingNow] = useState(false); const [mutationError, setMutationError] = useState('');
  const visible = useMemo(() => data.items.filter((item) => (item.title + ' ' + item.url + ' ' + (item.notes || '') + ' ' + item.type).toLowerCase().includes(query.toLowerCase())), [data.items, query]);
  const remove = async () => { setDeletingNow(true); setMutationError(''); try { await data.remove(deleting); setDeleting(null); } catch (err) { setMutationError(getApiError(err, 'Could not delete this resource.')); } finally { setDeletingNow(false); } };
  return <><PageHeader title="Resources" action={<button className="button button-primary" onClick={() => setEditing(null)}>Save resource</button>} /><div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search resources" /></div><ErrorBanner onRetry={data.load}>{data.error || mutationError}</ErrorBanner>{data.loading ? <LoadingState /> : !visible.length ? <EmptyState title={query ? 'No results' : 'No resources'} action={!query && <button className="button button-outline" onClick={() => setEditing(null)}>Add resource</button>} /> : <div className="resource-grid">{visible.map((item) => <ResourceCard key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />)}</div>}{editing !== undefined && <RecordModal kind="resources" item={editing} onClose={() => setEditing(undefined)} onSave={(payload) => data.save(editing, payload)} />}{deleting && <ConfirmDelete item={deleting} label="resource" onClose={() => setDeleting(null)} onConfirm={remove} loading={deletingNow} />}</>;
}

function SnippetCard({ item, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(item.code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); } };
  return <article className="snippet-card"><div className="snippet-card-header"><div className="snippet-heading"><div><h3>{item.title}</h3><span className="language-label">{item.language || 'plaintext'}</span></div></div><div className="card-actions"><button className="card-action-button" onClick={onEdit}>Edit</button><button className="card-action-button delete-action" onClick={onDelete}>Delete</button></div></div>{item.description && <p className="snippet-description">{item.description}</p>}<div className="code-window"><div className="code-window-bar"><button onClick={copy}>{copied ? 'Copied' : 'Copy code'}</button></div><pre><code>{item.code}</code></pre></div><div className="snippet-card-footer"><div className="tag-list">{(item.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => <span className="tag-pill" key={tag}>{tag}</span>)}</div></div></article>;
}

export function SnippetsPage() {
  const data = useCollection('/snippets', 'snippets'); const [query, setQuery] = useState(''); const [editing, setEditing] = useState(undefined); const [deleting, setDeleting] = useState(null); const [deletingNow, setDeletingNow] = useState(false); const [mutationError, setMutationError] = useState('');
  const visible = useMemo(() => data.items.filter((item) => (item.title + ' ' + (item.description || '') + ' ' + (item.language || '') + ' ' + (item.tags || '')).toLowerCase().includes(query.toLowerCase())), [data.items, query]);
  const remove = async () => { setDeletingNow(true); setMutationError(''); try { await data.remove(deleting); setDeleting(null); } catch (err) { setMutationError(getApiError(err, 'Could not delete this snippet.')); } finally { setDeletingNow(false); } };
  return <><PageHeader title="Snippets" action={<button className="button button-primary" onClick={() => setEditing(null)}>New snippet</button>} /><div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search snippets, tags, language" /></div><ErrorBanner onRetry={data.load}>{data.error || mutationError}</ErrorBanner>{data.loading ? <LoadingState /> : !visible.length ? <EmptyState title={query ? 'No results' : 'No snippets'} action={!query && <button className="button button-outline" onClick={() => setEditing(null)}>Add snippet</button>} /> : <div className="snippet-grid">{visible.map((item) => <SnippetCard key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />)}</div>}{editing !== undefined && <RecordModal kind="snippets" item={editing} onClose={() => setEditing(undefined)} onSave={(payload) => data.save(editing, payload)} />}{deleting && <ConfirmDelete item={deleting} label="snippet" onClose={() => setDeleting(null)} onConfirm={remove} loading={deletingNow} />}</>;
}

const statusLabels = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };
function TaskCard({ item, onEdit, onDelete, onStatusChange, statusBusy }) {
  const due = item.dueDate ? new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  return <article className={'task-card' + (item.status === 'done' ? ' task-done' : '')}><div className="task-card-top"><h3>{item.title}</h3><div className="card-actions"><button className="card-action-button" onClick={onEdit}>Edit</button><button className="card-action-button delete-action" onClick={onDelete}>Delete</button></div></div>{item.description && <p className="task-description">{item.description}</p>}<div className="task-card-meta"><span className={'priority-pill priority-' + (item.priority || 'medium')}>{item.priority || 'medium'} priority</span>{item.project && <span className="project-label">{item.project}</span>}</div><div className="task-card-bottom"><label className="status-select-label"><select value={item.status} disabled={statusBusy} onChange={(event) => onStatusChange(item, event.target.value)} aria-label="Task status">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{due && <span className="due-date">Due {due}</span>}</div></article>;
}

export function TasksPage() {
  const data = useCollection('/tasks', 'tasks'); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [editing, setEditing] = useState(undefined); const [deleting, setDeleting] = useState(null); const [deletingNow, setDeletingNow] = useState(false); const [busyId, setBusyId] = useState(null); const [mutationError, setMutationError] = useState('');
  const [filteredTasks, setFilteredTasks] = useState(null); const [filterLoading, setFilterLoading] = useState(false); const [filterError, setFilterError] = useState('');
  useEffect(() => {
    let active = true;
    if (filter === 'all') { setFilteredTasks(null); setFilterLoading(false); setFilterError(''); return () => { active = false; }; }
    setFilteredTasks(null); setFilterLoading(true); setFilterError('');
    api.get('/tasks', { params: { status: filter } }).then(({ data: result }) => { if (active) setFilteredTasks(result); }).catch((err) => { if (active) setFilterError(getApiError(err, 'Could not filter your tasks.')); }).finally(() => { if (active) setFilterLoading(false); });
    return () => { active = false; };
  }, [filter, data.items]);
  const sourceTasks = filter === 'all' ? data.items : (filteredTasks || []);
  const visible = useMemo(() => sourceTasks.filter((item) => (item.title + ' ' + (item.description || '') + ' ' + (item.project || '')).toLowerCase().includes(query.toLowerCase())), [sourceTasks, query]);
  const updateStatus = async (item, status) => { setBusyId(item.id); setMutationError(''); try { const { data: updated } = await api.patch('/tasks/' + item.id + '/status', { status }); data.setItems((current) => current.map((task) => task.id === item.id ? updated : task)); } catch (err) { setMutationError(getApiError(err, 'Could not update this task.')); } finally { setBusyId(null); } };
  const remove = async () => { setDeletingNow(true); setMutationError(''); try { await data.remove(deleting); setDeleting(null); } catch (err) { setMutationError(getApiError(err, 'Could not delete this task.')); } finally { setDeletingNow(false); } };
  return <><PageHeader title="Tasks" action={<button className="button button-primary" onClick={() => setEditing(null)}>Add task</button>} /><div className="toolbar task-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search tasks" /><div className="task-filters" role="group" aria-label="Filter tasks">{[['all', 'All'], ['todo', 'To do'], ['in-progress', 'In progress'], ['done', 'Done']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={'filter-tab' + (filter === value ? ' selected' : '')}>{label}</button>)}</div></div><ErrorBanner onRetry={data.load}>{data.error || filterError || mutationError}</ErrorBanner>{data.loading || filterLoading ? <LoadingState /> : !visible.length ? <EmptyState title="No tasks" action={filter === 'all' && !query && <button className="button button-outline" onClick={() => setEditing(null)}>Add task</button>} /> : <div className="task-list">{visible.map((item) => <TaskCard key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} onStatusChange={updateStatus} statusBusy={busyId === item.id} />)}</div>}{editing !== undefined && <RecordModal kind="tasks" item={editing} onClose={() => setEditing(undefined)} onSave={(payload) => data.save(editing, payload)} />}{deleting && <ConfirmDelete item={deleting} label="task" onClose={() => setDeleting(null)} onConfirm={remove} loading={deletingNow} />}</>;
}
