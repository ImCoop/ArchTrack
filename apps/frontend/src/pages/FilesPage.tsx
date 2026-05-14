import { Download, ExternalLink, FileUp, Lock, Plus, RefreshCcw, Search } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { documentApi } from '../features/business/business-api';
import { projectApi } from '../features/operations/operations-api';
import { documentStatuses, type DocumentStatus, type ProjectDocument } from '../types/business';
import type { Project } from '../types/operations';

const fileTypes: ProjectDocument['fileType'][] = ['DWG', 'DXF', 'PDF', 'STEP', 'DOCX', 'XLSX', 'ZIP'];
const labels: Record<DocumentStatus, string> = { draft: 'Draft', review: 'Review', approved: 'Approved', locked: 'Locked' };
const emptyForm = { projectId: '', fileName: '', fileType: 'PDF' as ProjectDocument['fileType'], fileSize: 0, status: 'draft' as DocumentStatus, mimeType: '' };

const fileToBase64 = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const typeFromFileName = (fileName: string): ProjectDocument['fileType'] => {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return fileTypes.find((item) => item === ext) ?? 'PDF';
};

export function FilesPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DocumentStatus | 'all'>('all');

  const load = useCallback(async () => {
    const [nextDocuments, nextProjects] = await Promise.all([
      documentApi.list({ search, status }),
      projectApi.list({ status: 'all' }),
    ]);
    setDocuments(nextDocuments);
    setProjects(nextProjects);
  }, [search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const projectName = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.projectName])),
    [projects],
  );

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selectedFile) return;
    const fileContentBase64 = await fileToBase64(selectedFile);
    await documentApi.create({
      ...form,
      projectId: form.projectId || undefined,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type || undefined,
      fileContentBase64,
    });
    setForm(emptyForm);
    setSelectedFile(null);
    await load();
  }

  async function setDocumentStatus(document: ProjectDocument, next: DocumentStatus) {
    await documentApi.update(document.id, { status: next, lockedBy: next === 'locked' ? document.uploadedBy : undefined });
    await load();
  }

  async function revise(document: ProjectDocument) {
    await documentApi.revise(document.id, {
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
    });
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={save}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">File Upload</h2><FileUp className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
            Project
            <select className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
              <option value="">No project linked</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.projectName}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
            File
            <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" type="file" onChange={async (event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              if (!file) return;
              setForm((current) => ({
                ...current,
                fileName: file.name,
                fileType: typeFromFileName(file.name),
                fileSize: file.size,
                mimeType: file.type,
              }));
            }} required />
          </label>
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="File name" value={form.fileName} onChange={(event) => setForm({ ...form, fileName: event.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              File type
              <select className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.fileType} onChange={(event) => setForm({ ...form, fileType: event.target.value as ProjectDocument['fileType'] })}>{fileTypes.map((type) => <option key={type}>{type}</option>)}</select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Status
              <select className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DocumentStatus })}>{documentStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
            </label>
          </div>
          <div className="rounded-md bg-field px-3 py-2 text-sm dark:bg-slate-800">
            <p>{selectedFile ? `${selectedFile.name} · ${Math.max(selectedFile.size / 1024, 1).toFixed(1)} KB` : 'Choose a file to upload it into ArchTrack storage.'}</p>
            <p className="text-steel dark:text-slate-400">If the project has a Drive folder, ArchTrack will also try to sync the file there.</p>
          </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Upload file</button>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Documents</h2><p className="text-sm text-steel dark:text-slate-400">Track revisions, approval state, local storage, and Drive sync.</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
            <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700"><Search size={17} className="text-steel" /><input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search files" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as DocumentStatus | 'all')}><option value="all">All status</option>{documentStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-steel dark:border-slate-800"><th className="py-3">File</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Storage</th><th className="px-3 py-3">Rev</th><th className="px-3 py-3">Status</th><th className="py-3 text-right">Actions</th></tr></thead>
            <tbody>{documents.map((document) => <tr key={document.id} className="border-b border-line last:border-b-0 dark:border-slate-800"><td className="py-3"><div className="font-medium text-ink dark:text-white">{document.fileName}</div><div className="text-xs text-steel dark:text-slate-400">{document.fileType} · {Math.max(document.fileSize / 1024, 1).toFixed(1)} KB</div>{document.lastSyncError ? <div className="text-xs text-red-600 dark:text-red-300">{document.lastSyncError}</div> : null}</td><td className="px-3 py-3">{document.projectId ? projectName[document.projectId] ?? document.projectId : 'Unlinked'}</td><td className="px-3 py-3"><span className="rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800">{document.storageProvider === 'hybrid' ? 'Local + Drive' : document.storageProvider === 'google_drive' ? 'Drive' : 'Local'}</span></td><td className="px-3 py-3">R{document.revision}</td><td className="px-3 py-3"><span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[document.status]}</span></td><td className="py-3"><div className="flex justify-end gap-2"><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" type="button" onClick={() => void documentApi.download(document.id, document.fileName)}><Download size={14} />Download</button>{document.driveViewUrl ? <a className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" href={document.driveViewUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />Drive</a> : null}<button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" onClick={() => void revise(document)} type="button"><RefreshCcw size={14} />Revise</button><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 dark:border-slate-700" onClick={() => void setDocumentStatus(document, document.status === 'locked' ? 'review' : 'locked')} type="button"><Lock size={14} />{document.status === 'locked' ? 'Unlock' : 'Lock'}</button></div></td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}
