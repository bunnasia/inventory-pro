import { appVersion } from "@/version"
import { type Language, LANGUAGES, saveLanguage, t } from "@/i18n"
interface HeaderProps {
  lang: Language
  onLangChange: (lang: Language) => void
}

export function Header({ lang, onLangChange }: HeaderProps) {
  const strings = t(lang)

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-sky-400 tracking-tight leading-none">Inventory Pro</h1>
        <p className="text-xs text-slate-500 mt-0.5 leading-none">v{appVersion}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 hidden sm:block">{strings.language}</span>
        <div className="flex gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                saveLanguage(l.code)
                onLangChange(l.code)
              }}
              className={[
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                lang === l.code
                  ? "bg-sky-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600",
              ].join(" ")}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
