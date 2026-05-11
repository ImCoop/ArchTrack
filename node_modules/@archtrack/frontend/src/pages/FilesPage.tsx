import { FileUp, Lock, Plus, RefreshCcw, Search } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { documentApi } from '../features/business/business-api';
import { documentStatuses, type DocumentStatus, type ProjectDocument } from '../types/business';

const fileTypes: ProjectDocument['fileType'][] = ['DWG', 'DXF', 'PDF', 'STEP', 'DOCX', 'XLSX', 'ZIP'];
const labels: Record<DocumentStatus, string> = { draft: 'Draft', review: 'Review', approved: 'Approved', locked: 'Locked' };
const emptyForm = { projectId: '', fileName: '', fileType: 'PDF' as ProjectDocument['fileType'], fileSize: 250000, status: 'draft' as DocumentStatus };

export function FilesPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DocumentStatus | 'all'>('all');

  const load = useCallback(async () => setDocuments(await documentApi.list({ search, status })), [search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    await documentApi.create({ ...form, projectId: form.projectId || undefined });
    setForm(emptyForm);
    await load();
  }

  async function setDocumentStatus(document: ProjectDocument, next: DocumentStatus) {
    await documentApi.update(document.id, { status: next, lockedBy: next === 'locked' ? document.uploadedBy : undefined });
    await load();
  }

  async function revise(document: ProjectDocument) {
    await documentApi.revise(document.id, { fileName: document.fileName, fileType: document.fileType, fileSize: document.fileSize });
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={save}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">File Upload</h2><FileUp className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Project ID" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} />
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="File name" value={form.fileName} onChange={(event) => setForm({ ...form, fileName: event.target.value })} required />
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.fileType} onChange={(event) => setForm({ ...form, fileType: event.target.value as ProjectDocument['fileType'] })}>{fileTypes.map((type) => <option key={type}>{type}</option>)}</select>
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" min={1} type="number" value={form.fileSize} onChange={(event) => setForm({ ...form, fileSize: Number(event.target.value) })} />
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DocumentStatus })}>{documentStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Save file</button>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Documents</h2><p className="text-sm text-steel dark:text-slate-400">Track revisions, approval state, and check-out locks.</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
            <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700"><Search size={17} className="text-steel" /><input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search files" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as DocumentStatus | 'all')}><option value="all">All status</option>{documentStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-steel dark:border-slate-800"><th className="py-3">File</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Rev</th><th className="px-3 py-3">Status</th><th className="py-3 text-right">Actions</th></tr></thead>
            <tbody>{documents.map((document) => <tr key={document.id} className="border-b border-line last:border-b-0 dark:border-slate-800"><td className="py-3 font-medium text-ink dark:text-white">{document.fileName}</td><td className="px-3 py-3">{document.fileType}</td><td className="px-3 py-3">R{document.revision}</td><td className="px-3 py-3"><span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[document.status]}</span></td><td className="py-3"><div className="flex justify-end gap-2"><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" onClick={() => void revise(document)} type="button"><RefreshCcw size={14} />Revise</button><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" onClick={() => void setDocumentStatus(document, document.status === 'locked' ? 'review' : 'locked')} type="button"><Lock size={14} />{document.status === 'locked' ? 'Unlock' : 'Lock'}</button></div></td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}
