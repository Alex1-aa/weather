import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

// Collapse whitespace so the checks don't depend on how the CSS is formatted.
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8').replace(/\s+/g, ' ')

describe('responsive layout contract', () => {
  it('declares tablet and mobile breakpoints with a stacked content layout', () => {
    expect(css).toContain('@media (max-width: 760px)')
    expect(css).toContain('@media (max-width: 520px)')
    expect(css).toContain('.content-layout { display: flex; flex-direction: column; }')
    expect(css).toContain('.forecast-grid { grid-template-columns: repeat(2, 1fr); }')
  })
})
