export {}

const toolbar = '.block-toolbar:visible'
const expectGroup = (id: string) => cy.get(toolbar).should('have.attr', 'data-current-group', id)
const go = (label: string) => cy.get(`${toolbar} button[aria-label="Zu ${label}"]`).click({ scrollBehavior: false })
const scrollContent = () => cy.get('ion-content:visible').first().shadow().find<HTMLElement>('[part="scroll"]')

const reset = () => {
  cy.contains('ion-header:visible ion-button', 'Neu').click()
  cy.contains('ion-alert button', 'Ja').click()
  cy.get('ion-alert').should('not.exist')
  expectGroup('einsatz')
  cy.get(`${toolbar} .edit-indicator`).should('have.attr', 'aria-label', 'Unverändert')
}

for (const width of [375, 1024]) {
  describe(`block toolbar at ${width}px`, () => {
    beforeEach(() => {
      cy.viewport(width, width === 375 ? 667 : 900)
      cy.visit('/')
      cy.get(toolbar).should('be.visible')
      reset()
    })

    it('centers its label, navigates in both directions, and keeps headings unobscured', () => {
      cy.get(`${toolbar} button`).first().should('be.disabled')
      cy.get(toolbar).should($bar => {
        const rect = $bar[0].getBoundingClientRect()
        const label = $bar[0].querySelector('.group-label')!.getBoundingClientRect()
        expect(label.left + label.width / 2).to.be.closeTo(rect.left + rect.width / 2, 1)
        expect($bar[0].querySelector('button')!.getBoundingClientRect().height).to.eq(44)
        const appToolbar = $bar[0].parentElement!.querySelector('ion-toolbar')!.getBoundingClientRect()
        expect(rect.top).to.be.greaterThan(appToolbar.bottom)
      })
      cy.screenshot(`block-toolbar-einsatz-${width}`, { capture: 'viewport' })
      for (const group of ['ABCDE', 'SAMPLER', 'AUFGABEN']) {
        go(group)
        expectGroup(group.toLowerCase())
        cy.get(`[data-doku-group="${group.toLowerCase()}"] > ion-card`).should($card => {
          const bar = $card[0].ownerDocument.querySelector('.block-toolbar')!.getBoundingClientRect()
          expect($card[0].getBoundingClientRect().top).to.be.at.least(bar.bottom)
        })
      }
      cy.get(`${toolbar} button`).last().should('be.disabled')
      for (const group of ['SAMPLER', 'ABCDE', 'EINSATZ']) {
        go(group)
        expectGroup(group.toLowerCase())
      }
      // Scroll the real Ionic shadow scroll container independently of the toolbar.
      scrollContent().should($scroll => { expect($scroll[0].scrollTop).to.eq(0) })
      scrollContent().then($scroll => { $scroll[0].scrollTop = $scroll[0].scrollHeight })
      expectGroup('aufgaben')
      scrollContent().then($scroll => { $scroll[0].scrollTop = 0 })
      expectGroup('einsatz')
    })

    it('skips hidden groups, handles a short final card, and resets indicators', () => {
      cy.contains('[data-doku-group="einsatz"] ion-chip', 'Verlegung').click()
      cy.get(`${toolbar} .edit-indicator`).should('have.attr', 'aria-label', 'Bearbeitet')
      cy.get('[data-doku-group="abcde"]').should('not.be.visible')
      cy.get('[data-doku-group="sampler"]').should('not.be.visible')
      // Keep the real page, but constrain the last card to exercise a bottom-clamped target.
      cy.get('[data-doku-group="aufgaben"]').invoke('attr', 'style', 'height: 180px; overflow: hidden')
      scrollContent().then($scroll => { $scroll[0].scrollTop = 0 })
      expectGroup('einsatz')
      go('AUFGABEN')
      expectGroup('aufgaben')
      scrollContent().should($scroll => {
        const element = $scroll[0]
        expect(element.scrollTop + element.clientHeight).to.be.closeTo(element.scrollHeight, 2)
      })
      go('EINSATZ')
      expectGroup('einsatz')
      cy.contains('[data-doku-group="einsatz"] ion-button', 'NEF vor Ort').click()
      cy.get(`${toolbar} button`).each($button => cy.wrap($button).should('be.disabled'))
      cy.get('[data-doku-group="aufgaben"]').should('not.be.visible')
      reset()
      cy.get(`${toolbar} button[aria-label="Zu ABCDE"]`).should('be.enabled')
    })

    it('restores tracking after tab re-entry and updates on layout changes', () => {
      go('ABCDE')
      expectGroup('abcde')
      cy.contains('ion-tab-button', 'Einstellungen').click()
      cy.get(toolbar).should('not.exist')
      cy.contains('ion-tab-button', 'Eingabe').click()
      expectGroup('abcde')
      // Expanding an earlier section moves the heading below the viewport boundary.
      scrollContent().invoke('css', 'overflow-anchor', 'none')
      cy.get('[data-doku-group="einsatz"]').invoke('css', 'padding-bottom', '200px')
      expectGroup('einsatz')
      go('ABCDE')
      expectGroup('abcde')
      reset()
    })

    it('updates edit state on input/reversion and supports keyboard navigation and light theme colors', () => {
      cy.get('.ns-age-input input').first().clear().type('65').blur()
      cy.get(`${toolbar} .edit-indicator`).should('have.attr', 'aria-label', 'Bearbeitet')
      cy.get('.ns-age-input input').first().clear().type('50').blur()
      cy.get(`${toolbar} .edit-indicator`).should('have.attr', 'aria-label', 'Unverändert')
      cy.get(`${toolbar} button[aria-label="Zu ABCDE"]`).focus().type('{enter}')
      expectGroup('abcde')
      cy.document().then(doc => {
        const style = doc.documentElement.style
        style.setProperty('--ion-card-background', '#ffffff')
        style.setProperty('--ion-background-color', '#ffffff')
        style.setProperty('--ion-text-color', '#111111')
        style.setProperty('--ion-color-step-200', '#dddddd')
        style.setProperty('--ion-color-medium', '#666666')
      })
      cy.get(toolbar).should('have.css', 'background-color', 'rgb(255, 255, 255)')
      cy.get(`${toolbar} button`).last().should('have.css', 'color', 'rgb(102, 102, 102)')
      cy.screenshot(`block-toolbar-light-${width}`, { capture: 'viewport' })
    })
  })
}
