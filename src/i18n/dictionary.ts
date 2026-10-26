/**
 * ZH/EN interface translation (no dependency).
 *
 * Shared application chrome lives here. Production-domain display names are
 * kept in `domainLabels.ts`, while feature-specific copy stays beside the
 * component that owns it. Stored enum values and user-authored project data
 * remain untouched so switching languages never changes a project file.
 */
export type AppLanguage = 'en' | 'zh';

const LANG_KEY = 'openshotdesigner_lang';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'zh'];

export const detectLanguage = (): AppLanguage => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
};

export const persistLanguage = (lang: AppLanguage): void => {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Preference only — never break the app over it.
  }
};

const en = {
  'save.saving': 'Saving…',
  'save.saved': 'Saved locally',
  'save.error': 'Save failed',
  'save.retry': 'Retry',
  'nav.dashboard': 'All projects (dashboard)',
  'nav.rename': 'Click to rename project',
  'nav.language': 'Language',
  'nav.languageToChinese': 'Switch interface to Chinese',
  'nav.languageToEnglish': 'Switch interface to English',
  'nav.undo': 'Undo (Ctrl+Z)',
  'nav.redo': 'Redo (Ctrl+Y)',
  'nav.snapOn': 'Snap to grid: ON',
  'nav.snapOff': 'Snap to grid: OFF',
  'nav.templates': 'Templates',
  'nav.viewing': 'Viewing options',
  'nav.viewfinder': 'Viewfinder',
  'nav.export': 'Export and print',
  'nav.saveProject': 'Save project file',
  'nav.openProject': 'Open or import project',
  'theme.toDark': 'Switch to dark theme',
  'theme.toLight': 'Switch to light theme',
  'theme.dark': 'Dark',
  'theme.light': 'Light',
  'dashboard.title': 'Projects',
  'dashboard.subtitle': 'Start a new project or continue locally saved work.',
  'dashboard.new': 'New project',
  'dashboard.open': 'Open',
  'dashboard.continue': 'Continue',
  'dashboard.create': 'Create',
  'dashboard.import': 'Import project file',
  'dashboard.productionTitle': 'Production title',
  'dashboard.workspacePreset': 'Workspace preset',
  'dashboard.savedProjects': 'Saved projects',
  'dashboard.noProjects': 'No projects yet',
  'dashboard.noProjectsHint': 'Name your production above and press Create to get started.',
  'dashboard.demoTitle': 'S4-M2 test case: Late-night street stall',
  'dashboard.demoDescription': 'Includes actor START/K01/END states, a key-prop path, action axis, camera-safe zone and two test shots.',
  'dashboard.openDemo': 'Open MFF case',
  'dashboard.back': 'Back to workspace',
  'dashboard.backupAvailable': 'Safety copy available',
  'dashboard.restoreBackup': 'Restore safety copy',
  'conflict.reload': 'Reload',
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'workspace.inspector': 'Inspector',
  'workspace.shots': 'Shot list',
  'workspace.storyboard': 'Storyboard',
  'workspace.script': 'Script',
  'workspace.loading': 'Loading…',
} as const;

export type I18nKey = keyof typeof en;

const zh: Record<I18nKey, string> = {
  'save.saving': '正在保存…',
  'save.saved': '已保存到本地',
  'save.error': '保存失败',
  'save.retry': '重试',
  'nav.dashboard': '全部项目',
  'nav.rename': '点击重命名项目',
  'nav.language': '界面语言',
  'nav.languageToChinese': '切换为中文界面',
  'nav.languageToEnglish': '切换为英文界面',
  'nav.undo': '撤销（Ctrl+Z）',
  'nav.redo': '重做（Ctrl+Y）',
  'nav.snapOn': '吸附网格：开',
  'nav.snapOff': '吸附网格：关',
  'nav.templates': '模板',
  'nav.viewing': '显示选项',
  'nav.viewfinder': '取景器',
  'nav.export': '导出与打印',
  'nav.saveProject': '保存项目文件',
  'nav.openProject': '打开或导入项目',
  'theme.toDark': '切换为暗色主题',
  'theme.toLight': '切换为明色主题',
  'theme.dark': '暗色',
  'theme.light': '明色',
  'dashboard.title': '项目',
  'dashboard.subtitle': '新建项目，或继续保存在当前浏览器中的工作。',
  'dashboard.new': '新建项目',
  'dashboard.open': '打开',
  'dashboard.continue': '继续',
  'dashboard.create': '创建',
  'dashboard.import': '导入项目文件',
  'dashboard.productionTitle': '项目名称',
  'dashboard.workspacePreset': '工作区预设',
  'dashboard.savedProjects': '已保存项目',
  'dashboard.noProjects': '暂无项目',
  'dashboard.noProjectsHint': '在上方输入项目名称并点击“创建”。',
  'dashboard.demoTitle': 'S4-M2 测试案例：深夜路边摊',
  'dashboard.demoDescription': '已配置人物 START/K01/END、关键道具路径、动作轴、摄影机允许侧和两条测试镜头。',
  'dashboard.openDemo': '打开 MFF 案例',
  'dashboard.back': '返回工作区',
  'dashboard.backupAvailable': '存在安全副本',
  'dashboard.restoreBackup': '恢复安全副本',
  'conflict.reload': '重新加载',
  'common.close': '关闭',
  'common.cancel': '取消',
  'common.delete': '删除',
  'common.save': '保存',
  'workspace.inspector': '检查器',
  'workspace.shots': '镜头表',
  'workspace.storyboard': '故事板',
  'workspace.script': '剧本',
  'workspace.loading': '正在加载…',
};

const dictionaries: Record<AppLanguage, Record<I18nKey, string>> = { en, zh };

export const translate = (lang: AppLanguage, key: I18nKey): string =>
  dictionaries[lang]?.[key] ?? en[key];
