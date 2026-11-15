import ts from 'typescript'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dir, '..')
const keys = new Set<string>(['owner', 'admin', 'billing', 'member', 'auditor', 'normal', 'empty', 'loading', 'error', 'restricted', 'paused', 'context', 'input', 'tokens', 'used', 'per million tokens', '简体中文', '繁體中文', 'English', 'Русский'])
function visitDirectory(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name)
    if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'i18n') visitDirectory(file)
    if (!entry.isFile() || entry.name === 'test-setup.ts' || !/\.tsx?$/.test(entry.name)) continue
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent = node.parent
        if (ts.isJsxAttribute(parent) && ['d', 'points', 'viewBox', 'transform', 'pathLength'].includes(parent.name.getText(source))) return
        const text = node.text
        const looksLikeSvgPath = text.length > 40 && /^[Mm][0-9.+\- ,a-zA-Z]+$/.test(text) && /\d/.test(text)
        if (looksLikeSvgPath) return
        if (/^(?:[A-Z]|\{\{\w+\}\})[A-Za-z0-9 ,.:;!?&+/(){}'’–·_\-…]*$/.test(text) && !['NFKC', 'Enter'].includes(text) && !text.includes('_') && !text.startsWith('DEMO') && text.length > 1) keys.add(text)
        if (ts.isCallExpression(node.parent) && node.parent.expression.getText(source) === 't' && node.parent.arguments[0] === node) keys.add(text)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}
visitDirectory(join(root, 'src'))
for (const label of ['Overview', 'API keys', 'Members', 'Usage', 'Guardrails', 'Workspace settings']) keys.add(`Workspace: ${label}`)
const directory = join(root, 'src/i18n/locales')
const file = join(directory, 'en.json')
const existing: Record<string, string> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
const missing = [...keys].filter((key) => !(key in existing)).sort()
if (process.argv.includes('--check')) {
  console.log(JSON.stringify({ missing }, null, 2))
  process.exitCode = missing.length ? 1 : 0
} else {
  const output = { ...existing, ...Object.fromEntries(missing.map((key) => [key, key])) }
  mkdirSync(directory, { recursive: true })
  writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Added ${missing.length} keys; preserved existing translations and rich text`)
}
