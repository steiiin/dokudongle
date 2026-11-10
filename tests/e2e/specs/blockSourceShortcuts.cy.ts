export {}

const pressKey = (key: 'Enter' | ' ') => cy.then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyDown', key, code: key === ' ' ? 'Space' : key,
    windowsVirtualKeyCode: key === ' ' ? 32 : 13, text: key === ' ' ? ' ' : '\r' },
})).then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyUp', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: key === ' ' ? 32 : 13 },
}))

const cases = [
  { source: 'schwangerschaft', title: 'Schwangerschaft', input: 'Mehrlingsstatus', choice: 'Zwillinge', parent: '', section: 'exposure' },
  { source: 'schwindel', title: 'Schwindel', input: 'Beginn', choice: 'Plötzlich', parent: '', section: 'disability' },
  { source: 'excretions_bowel', title: 'Stuhlgang', input: 'Frequenz', choice: 'Durchfall', parent: 'Ausscheidung', section: 'exposure' },
  { source: 'excretions_urinary', title: 'Wasserlassen', input: 'Blut im Urin', choice: 'Etwas', parent: 'Ausscheidung', section: 'exposure' },
  { source: 'bauchschmerz', title: 'Bauchschmerz', input: 'Beginn', choice: 'Plötzlich', parent: 'Bauchbefund', section: 'exposure' },
]

for (const width of [375, 1024]) {
  describe(`block source shortcuts at ${width}px`, () => {
    for (const entry of cases) {
      it(`${entry.source} edits shared details and preserves the calling view`, () => {
        cy.viewport(width, width === 375 ? 600 : 900)
        const url = `/tests/e2e/fixtures/examination.html?${entry.section}&shortcuts`
        cy.visit(url)
        cy.document().then(doc => {
          doc.addEventListener('ionModalDidPresent', event => (event.target as HTMLElement).setAttribute('data-presented', 'true'))
          doc.addEventListener('ionModalWillDismiss', event => (event.target as HTMLElement).removeAttribute('data-presented'))
        })
        if (entry.parent) {
          cy.contains('.examination-control > ion-item', entry.parent)
            .then($row => $row[0].scrollIntoView({ block: 'center' })).click({ scrollBehavior: false })
          cy.get('ion-modal:visible').should('have.attr', 'data-presented', 'true')
        }
        const shortcut = `[data-block-source="${entry.source}"]`
        cy.get(shortcut).then($button => $button[0].scrollIntoView({ block: 'center' }))
        let position: number
        let scrolls: { element: HTMLElement; top: number; left: number }[]
        cy.get(shortcut).should('be.visible').then($button => {
          const button = $button[0]
          position = button.getBoundingClientRect().top
          expect(button.getBoundingClientRect().right).to.be.at.most(width)
          expect(button.getBoundingClientRect().width).to.be.at.least(24)
        })
        cy.get('ion-content:visible').then(async $contents => {
          scrolls = await Promise.all(Array.from($contents, async content => {
            const element = await (content as HTMLElement & { getScrollElement(): Promise<HTMLElement> }).getScrollElement()
            return { element, top: element.scrollTop, left: element.scrollLeft }
          }))
        })
        if (width === 375 && ['schwangerschaft', 'excretions_bowel'].includes(entry.source)) {
          cy.screenshot(`shortcut-${entry.source}`, { capture: 'viewport' })
        }
        const expectPosition = () => {
          cy.location('pathname').should('eq', '/tests/e2e/fixtures/examination.html')
          cy.location('search').should('eq', `?${entry.section}&shortcuts`)
          cy.get(shortcut).should('be.focused').should($button => {
            expect($button[0].getBoundingClientRect().top).to.be.closeTo(position, 1)
            for (const saved of scrolls) {
              expect(saved.element.scrollTop).to.be.closeTo(saved.top, 1)
              expect(saved.element.scrollLeft).to.eq(saved.left)
            }
          })
          cy.get('ion-modal:visible').should('have.length', entry.parent ? 1 : 0)
          if (entry.parent) cy.get('ion-modal:visible ion-title').should('have.text', entry.parent)
        }

        cy.get(shortcut).click({ scrollBehavior: false })
        cy.get('ion-modal:visible').last().should('have.attr', 'data-presented', 'true')
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('ion-modal:visible').last().find('ion-title').should('have.text', entry.title)
        cy.get('ion-modal:visible').last().contains('ion-select', entry.input).click()
        cy.contains('ion-popover:visible ion-item', entry.choice).click()
        cy.get('ion-modal:visible').last().find('ion-button[title="Zurück"]').click()
        expectPosition()

        // Native keyboard events catch accidental activation of the enclosing toggle/select.
        for (const key of ['Enter', ' '] as const) {
          cy.get(shortcut).focus()
          pressKey(key)
          cy.get('ion-modal:visible').last().find('ion-title').should('have.text', entry.title)
          cy.get('ion-popover:visible').should('not.exist')
          cy.get('ion-modal:visible').last().contains('ion-select', entry.input).should('contain.text', entry.choice)
          cy.get('ion-modal:visible').last().find('ion-button[title="Zurück"]').click()
          expectPosition()
        }

        if (entry.parent) cy.get('ion-modal:visible ion-button[title="Zurück"]').click()
        cy.get('ion-modal:visible').should('not.exist')
        cy.contains('#original-block-forms ion-item', entry.title).scrollIntoView().click()
        cy.get('ion-modal:visible').contains('ion-select', entry.input).should('contain.text', entry.choice)
        cy.get('ion-modal:visible ion-button[title="Zurück"]').click()
      })
    }
  })
}
