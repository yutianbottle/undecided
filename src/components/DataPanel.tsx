import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { useLang } from '../i18n';
import { exportJSON, parseState, exportRaw, lastExportAt, STATE_VERSION } from '../state/storage';
import { downloadMarkdown } from '../lib/export';
import { fmtDateTime } from '../lib/date';
import type { AppState } from '../state/types';

export function DataPanel() {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { cases, importState, clearAll, readIssue, saveOK, saveMessage, retrySave } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [last, setLast] = useState(lastExportAt);
  const current = { cases, version: STATE_VERSION };
  const backup = () => { exportJSON(current); setLast(lastExportAt()); setMessage(L('已发起 JSON 下载，请确认文件已保存到你的设备。', 'JSON download started — check that the file was saved.')); };
  const duplicates = pending?.cases.filter(c => cases.some(x => x.id === c.id)).length ?? 0;
  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setMessage(''); setPending(null);
    const reader = new FileReader();
    reader.onerror = () => setError(L('文件读取失败，请重新选择。', 'Could not read the file. Choose it again.'));
    reader.onload = () => {
      try { setPending(parseState(JSON.parse(String(reader.result)))); setMode(readIssue ? 'replace' : 'merge'); }
      catch (err) { setError(err instanceof Error ? err.message : L('导入文件格式不正确。', 'That file is not a valid backup.')); }
    };
    reader.readAsText(file);
  }
  return <section>
    <h2 className="h2">{L('数据管理', 'Data')}</h2>
    <p className="hint">{L('全部内容仅存在当前设备、当前浏览器。不上传，不训练，不共享。', 'Everything lives in this browser on this device. Nothing is uploaded, trained on, or shared.')}</p>
    <div className="card" style={{ marginTop: 24 }}>
      <h3 className="card-t">{L('本机保存与备份', 'Storage and backup')}</h3>
      <p className={saveOK ? 'hint' : 'warn'} role="status">{saveOK ? L('已保存到本机', 'Saved on this device') : saveMessage}</p>
      {!saveOK && !readIssue && <button className="btn" onClick={retrySave}>{L('重试保存', 'Retry saving')}</button>}
      <p className="hint">{L('上次 JSON 导出操作：', 'Last JSON export: ')}{last ? fmtDateTime(last) : L('还没有导出记录', 'none yet')}{L('。请自行确认下载文件已保存。', '. Make sure the file was actually saved.')}</p>
      <div className="inline-actions">
        <button className="btn" onClick={backup}>{L('导出 JSON 备份', 'Export JSON backup')}</button>
        <button className="btn" onClick={() => downloadMarkdown(cases)}>{L('导出 Markdown 阅读版', 'Export Markdown')}</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>{L('选择备份导入', 'Import a backup')}</button>
        <input aria-label={L('选择 JSON 备份', 'Choose a JSON backup')} ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </div>
      {readIssue && <div style={{ marginTop: 16 }}><p className="warn">{L('请先保存原始数据，再尝试恢复。', 'Save the raw data first, then try to recover.')}</p><button className="btn" onClick={() => {
        try { exportRaw(); } catch (err) { setError(err instanceof Error ? err.message : L('原始数据导出失败。', 'Raw export failed.')); }
      }}>{L('导出原始数据', 'Export raw data')}</button></div>}
    </div>
    {pending && <div className="card" style={{ marginTop: 24 }}>
      <h3 className="card-t">{L('导入预览', 'Import preview')}</h3>
      <p className="hint">{L(`备份中有 ${pending.cases.length} 件案卷；本机有 ${cases.length} 件；相同 ID 有 ${duplicates} 件。`, `The backup has ${pending.cases.length} cases; this device has ${cases.length}; ${duplicates} IDs overlap.`)}</p>
      <fieldset className="form-group"><legend className="hint">{L('导入方式', 'Import mode')}</legend>
        <label className="radio-row"><input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />{L('合并，保留本机相同 ID 的记录', 'Merge — keep this device’s version for overlapping IDs')}</label>
        <label className="radio-row"><input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />{L('用备份替换全部本机记录', 'Replace everything on this device with the backup')}</label>
      </fieldset>
      <p className={mode === 'replace' ? 'warn' : 'hint'}>{mode === 'replace'
        ? L(`确认后，当前 ${cases.length} 件将由备份中的 ${pending.cases.length} 件替换。建议先导出当前备份。`, `This replaces your ${cases.length} cases with the ${pending.cases.length} in the backup. Export a backup first.`)
        : L(`将新增 ${pending.cases.length - duplicates} 件，相同 ID 的 ${duplicates} 件保留本机版本。`, `${pending.cases.length - duplicates} will be added; ${duplicates} overlapping IDs keep the local version.`)}</p>
      <div className="inline-actions"><button className="btn" onClick={() => {
        try { importState(pending, mode); setPending(null); setMessage(L('导入完成。', 'Import complete.')); }
        catch (err) { setError(err instanceof Error ? err.message : L('导入失败。', 'Import failed.')); }
      }}>{mode === 'replace' ? L('确认替换全部记录', 'Replace all records') : L('确认合并导入', 'Merge in')}</button><button className="btn btn--text" onClick={() => setPending(null)}>{L('取消', 'Cancel')}</button></div>
    </div>}
    {error && <p className="warn" role="alert">{error}</p>}{message && <p className="hint" role="status">{message}</p>}
    <div className="content-section"><h3 className="group-title">{L('清空记录', 'Erase records')}</h3><ClearData onClear={() => { clearAll(); setMessage(L('全部案卷已清空。', 'All cases erased.')); }} count={cases.length} blocked={!!readIssue} /></div>
    <div className="content-section"><a className="btn" href="#/about">{L('关于、使用说明与引用来源 →', 'About, how to use, and sources →')}</a></div>
  </section>;
}
function ClearData({ onClear, count, blocked }: { onClear: () => void; count: number; blocked: boolean }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [phase, setPhase] = useState<'idle' | 'counting' | 'armed'>('idle');
  const [left, setLeft] = useState(10);
  useEffect(() => {
    if (phase !== 'counting') return;
    if (left <= 0) { setPhase('armed'); return; }
    const t = window.setTimeout(() => setLeft(v => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, left]);
  if (blocked) return <p className="hint">{L('原始记录受写入保护。请先导出原始数据并恢复有效备份。', 'The record is write-protected. Export the raw data and restore a valid backup first.')}</p>;
  if (!count) return <p className="hint">{L('现在没有数据可清空。', 'There is nothing to erase.')}</p>;
  if (phase === 'idle') return <button className="btn btn--danger" onClick={() => { setLeft(10); setPhase('counting'); }}>{L('清空全部数据', 'Erase all data')}</button>;
  return <div><p className="warn">{L(`这会删除全部 ${count} 件案卷，包括已封存和归档的记录。请先导出备份，删除后不能撤销。`, `This deletes all ${count} cases, including sealed and reviewed ones. Export a backup first — there is no undo.`)}</p>
    <div className="inline-actions"><button className="btn btn--danger" disabled={phase !== 'armed'} onClick={onClear}>
      {phase === 'counting' ? L(`再等 ${left} 秒…`, `wait ${left}s…`) : L('确认清空，不可恢复', 'Erase — cannot be undone')}</button><button className="btn btn--text" onClick={() => setPhase('idle')}>{L('取消', 'Cancel')}</button></div>
  </div>;
}
