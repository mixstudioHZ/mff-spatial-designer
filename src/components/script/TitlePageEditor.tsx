import React from 'react';
import { useFloorPlan } from '../../context/FloorPlanContext';
import { TitlePageView } from './TitlePageView';
import { useLanguage } from '../../i18n/LanguageContext';

interface TitlePageEditorProps {
  isLight: boolean;
}

/**
 * The screenplay's cover, edited beside a live preview of itself.
 *
 * The fields are Fountain's standard title-page keys, so a script imported with
 * a cover arrives with these filled in and an exported one carries them back
 * out. Printing the cover is opt-in — plenty of productions print sides and
 * lined pages far more often than a submission draft — and the DRAFT stamp is
 * off until someone asks for it, because stamping a script that is going to a
 * financier is the expensive mistake here.
 */

/** Today's date in the same words the static placeholder used to show — a suggestion only, never written. */
const todayPlaceholder = (): string =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export const TitlePageEditor: React.FC<TitlePageEditorProps> = ({ isLight }) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';
  const { project, setTitlePage } = useFloorPlan();
  const page = project.titlePage ?? {};

  const inputCls = `w-full rounded-md border px-2 py-1.5 text-xs outline-none ${
    'border-line-strong bg-field text-ink-soft focus:border-violet-400 dark:focus:border-violet-500'
  }`;
  const labelCls = `text-[10px] font-bold uppercase tracking-wider text-ink-muted`;

  const field = (
    key: 'title' | 'credit' | 'authors' | 'source' | 'draftLabel' | 'date' | 'contact' | 'copyright' | 'notes',
    label: string,
    placeholder: string,
    rows = 0,
  ) => (
    <label className="block space-y-1">
      <span className={labelCls}>{label}</span>
      {rows > 0 ? (
        <textarea
          value={page[key] ?? ''}
          rows={rows}
          onChange={(event) => setTitlePage({ [key]: event.target.value || undefined })}
          placeholder={placeholder}
          className={`${inputCls} resize-y`}
        />
      ) : (
        <input
          value={page[key] ?? ''}
          onChange={(event) => setTitlePage({ [key]: event.target.value || undefined })}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </label>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] p-3 sm:p-5">
      <div className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black">{isZh ? '标题页' : 'Title page'}</h3>
          <p className={`text-[10px] text-ink-muted`}>
            {isZh ? '采用 Fountain 标准字段，导入时可读取封面内容，导出时也会完整保留。' : "Fountain's standard fields, so an imported cover arrives filled in and an exported script carries it back out."}
          </p>
        </div>

        <label className={`flex items-center gap-2 rounded-lg border p-2 text-[11px] font-semibold border-line-strong bg-field`}>
          <input
            type="checkbox"
            checked={page.enabled === true}
            onChange={(event) => setTitlePage({ enabled: event.target.checked })}
            className="accent-violet-600"
          />
          {isZh ? '随剧本打印标题页' : 'Print a title page with the script'}
        </label>

        {/* Off by default: the opposite of a call sheet, where an unfinished
            sheet going out looking final is the costly mistake. */}
        <label className={`flex items-center gap-2 rounded-lg border p-2 text-[11px] font-semibold border-line-strong bg-field`}>
          <input
            type="checkbox"
            checked={page.draft === true}
            onChange={(event) => setTitlePage({ draft: event.target.checked || undefined })}
            className="accent-rose-600"
          />
          {isZh ? '标记为草稿，在封面加盖“草稿”标识' : 'Mark as a draft — DRAFT stamp on the cover'}
        </label>

        {field('title', isZh ? '片名' : 'Title', project.scriptTitle || (isZh ? '未命名剧本' : 'Untitled Screenplay'))}
        {field('credit', isZh ? '署名说明' : 'Credit', isZh ? '编剧' : 'Written by')}
        {field('authors', isZh ? '作者' : 'Author(s)', isZh ? '每行填写一位作者' : 'One name per line', 2)}
        {field('source', isZh ? '改编来源' : 'Source', isZh ? '改编自…的小说' : 'Based on the novel by…')}
        <div className="grid grid-cols-2 gap-2">
          {field('draftLabel', isZh ? '稿次' : 'Draft', isZh ? '第一稿' : 'First Draft')}
          {field('date', isZh ? '日期' : 'Date', todayPlaceholder())}
        </div>
        {field('contact', isZh ? '联系方式' : 'Contact', isZh ? '机构、地址、电话' : 'Agency, address, phone', 3)}
        {field('copyright', isZh ? '版权' : 'Copyright', '© 2026 Lantern Pictures')}
        {field('notes', isZh ? '备注' : 'Notes', isZh ? '封面需要显示的其他内容' : 'Anything else the cover should carry', 2)}
      </div>

      <div className={`rounded-xl border overflow-hidden border-line-strong bg-surface`}>
        <div className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-b border-line text-ink-muted`}>
          {isZh ? `预览${page.enabled === true ? '' : '（勾选上方选项后才会打印）'}` : `Preview${page.enabled === true ? '' : ' — not printed until the box above is ticked'}`}
        </div>
        <div className={page.enabled === true ? '' : 'opacity-50'}>
          <TitlePageView page={page} fallbackTitle={project.scriptTitle} isLight={isLight} />
        </div>
      </div>
    </div>
  );
};
