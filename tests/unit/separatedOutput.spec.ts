import { describe, expect, test } from 'vitest'
import {
  assembleOutputGroups, defaultOutputSettings, hydrateOutputSettings, outputFromFragments,
  outputRows, projectOutputBlocks, removeOutputGroup, reorderOutputGroups, validOutputGroups,
} from '@/utils/separated-output'

const generated = () => outputFromFragments([
  { block: 'situation', text: 'Alpha one.\n\n' },
  { block: 'abcde', text: 'Beta two.\n\n' },
  { block: 'course', text: 'Gamma three.' },
])

describe('edited output ownership', () => {
  test('preserves unchanged text and assembles only configured contents in their order', () => {
    const doc = generated()
    const blocks = projectOutputBlocks(doc, doc.text)
    expect(blocks.situation).toBe('Alpha one.\n\n')
    expect(blocks.abcde).toBe('Beta two.\n\n')
    const groups = assembleOutputGroups([{ id: 'a', name: 'NEVER SENT', blocks: ['abcde', 'situation'] }], doc, doc.text)
    expect(groups[0].text).toBe('Beta two.\n\nAlpha one.')
  })

  test('keeps insertions, replacements and deletions in their respective blocks', () => {
    const doc = generated()
    const blocks = projectOutputBlocks(doc, doc.text.replace('one', 'changed one').replace('two', 'new').replace('Gamma three.', ''))
    expect(blocks.situation).toBe('Alpha changed one.\n\n')
    expect(blocks.abcde).toBe('Beta new.\n\n')
    expect(blocks.course).toBe('')
  })

  test('gives boundary insertions to the preceding block, and initial insertions to the following block', () => {
    const doc = generated()
    const blocks = projectOutputBlocks(doc, 'Prefix ' + doc.text.replace('Beta', 'Boundary Beta') + ' Suffix')
    expect(blocks.situation).toBe('Prefix Alpha one.\n\nBoundary ')
    expect(blocks.abcde).toBe('Beta two.\n\n')
    expect(blocks.course).toBe('Gamma three. Suffix')
  })

  test('assigns cross-block replacement once to the first affected block', () => {
    const doc = outputFromFragments([
      { block: 'situation', text: 'aaaa' }, { block: 'abcde', text: 'bbbb' }, { block: 'course', text: 'cccc' },
    ])
    const blocks = projectOutputBlocks(doc, 'aaREPLACEDcc')
    expect(blocks.situation).toContain('REPLACED')
    expect(Object.values(blocks).join('')).toBe('aaREPLACEDcc')
    expect(projectOutputBlocks(doc, 'Entire replacement').situation).toBe('Entire replacement')
    expect(Object.values(projectOutputBlocks(doc, '')).join('')).toBe('')
  })

  test('retains disjoint intervention and consent passages under the same block', () => {
    const doc = outputFromFragments([
      { block: 'measures', text: 'Intervention.\n\n' },
      { block: 'course', text: 'Verlauf.\n\n' },
      { block: 'measures', text: 'Consent.' },
    ])
    const [group] = assembleOutputGroups([{ id: 'a', name: 'A', blocks: ['measures'] }], doc, doc.text)
    expect(group.text).toBe('Intervention.\n\nConsent.')
  })

  test('retains manual-only content even if generation is empty', () => {
    expect(projectOutputBlocks({ text: '', spans: [] }, 'Manual').situation).toBe('Manual')
  })
})

describe('output configuration', () => {
  test('defaults to disabled with all nine blocks exactly once', () => {
    const config = defaultOutputSettings()
    expect(config.enabled).toBe(false)
    expect(validOutputGroups(config.groups)).toBe(true)
    expect(config.groups.map(group => group.name)).toEqual(['ANAMNESE', 'MAẞNAHMEN', 'VERLAUF'])
  })

  test('rejects invalid names, duplicate or missing blocks and corrupt stored preferences', () => {
    for (const change of [
      (config: ReturnType<typeof defaultOutputSettings>) => { config.groups[0].name = ' ' },
      (config: ReturnType<typeof defaultOutputSettings>) => { config.groups[0].name = 'verlauf' },
      (config: ReturnType<typeof defaultOutputSettings>) => { config.groups[0].blocks.push('course') },
      (config: ReturnType<typeof defaultOutputSettings>) => { config.groups[0].blocks.pop() },
    ]) {
      const config = defaultOutputSettings()
      change(config)
      expect(validOutputGroups(config.groups)).toBe(false)
      expect(hydrateOutputSettings(config)).toEqual(defaultOutputSettings())
    }
    expect(hydrateOutputSettings(null)).toEqual(defaultOutputSettings())
    expect(hydrateOutputSettings({ version: 1, enabled: true, groups: [null] })).toEqual(defaultOutputSettings())
  })

  test('moves complete groups and individual blocks across groups without losing blocks', () => {
    const groups = defaultOutputSettings().groups
    const moved = reorderOutputGroups(groups, 0, outputRows(groups).length - 1)
    expect(moved.map(group => group.id)).toEqual(['measures', 'course', 'anamnesis'])
    expect(moved[2].blocks).toEqual(groups[0].blocks)
    const movedBlock = reorderOutputGroups(groups, 2, outputRows(groups).length - 1)
    expect(movedBlock[2].blocks).toEqual(['course', 'situation'])
    expect(validOutputGroups(movedBlock)).toBe(true)
    const back = reorderOutputGroups(movedBlock, outputRows(movedBlock).length - 1, 0)
    expect(back[0].blocks[0]).toBe('situation')
    expect(validOutputGroups(back)).toBe(true)
    expect(groups).toEqual(defaultOutputSettings().groups)
  })

  test('supports empty groups and transfers removed blocks to a neighboring group', () => {
    const groups = defaultOutputSettings().groups
    const removedFirst = removeOutputGroup(groups, groups[0].id)
    expect(removedFirst[0].blocks).toEqual([...groups[1].blocks, ...groups[0].blocks])
    expect(validOutputGroups(removedFirst)).toBe(true)
    const removedMiddle = removeOutputGroup(groups, groups[1].id)
    expect(removedMiddle[0].blocks).toEqual([...groups[0].blocks, ...groups[1].blocks])
    const only = removeOutputGroup(removedMiddle, removedMiddle[1].id)
    expect(removeOutputGroup(only, only[0].id)).toEqual(only)
    const withEmpty = [...groups, { id: 'empty', name: 'EMPTY', blocks: [] }]
    const moved = reorderOutputGroups(withEmpty, 1, outputRows(withEmpty).length - 1)
    expect(moved[3].blocks).toEqual(['setting'])
    expect(validOutputGroups(moved)).toBe(true)
  })
})
