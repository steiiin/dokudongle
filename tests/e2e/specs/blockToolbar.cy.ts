import type { Components } from '@ionic/core'

const toolbar = '.block-toolbar:visible'
const expectGroup = (id: string) => cy.get(toolbar).should('have.attr', 'data-current-group', id)
const go = (label: string) => cy.get<HTMLElement & Components.IonContent>('ion-content:visible').first().then($content => {
  const scrollToPoint = cy.spy($content[0], 'scrollToPoint')
  cy.get(`${toolbar} button[aria-label="Zu ${label}"]`).click({ scrollBehavior: false })
  // The label now changes during scrolling; wait for navigation itself to finish.
  cy.then(() => {
    expect(scrollToPoint.callCount).to.eq(1)
    return scrollToPoint.lastCall.returnValue
  }).then(() => { scrollToPoint.restore() })
})
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

    it('tracks the largest visible block before its heading reaches the top in both directions', () => {
      // Place the EINSATZ/ABCDE boundary at known fractions of the real viewport.
      for (const [fraction, expected] of [[0.35, 'abcde'], [0.45, 'abcde'], [0.55, 'einsatz'], [0.65, 'einsatz']] as const) {
        scrollContent().then($scroll => {
          const element = $scroll[0]
          const section = element.ownerDocument.querySelector('[data-doku-group="abcde"]')!
          element.scrollTop += section.getBoundingClientRect().top - element.getBoundingClientRect().top - element.clientHeight * fraction
        })
        expectGroup(expected)
        scrollContent().should($scroll => {
          const element = $scroll[0]
          const viewportTop = element.getBoundingClientRect().top
          const bounds = element.ownerDocument.querySelector('[data-doku-group="abcde"]')!.getBoundingClientRect()
          expect(bounds.top - viewportTop).to.be.closeTo(element.clientHeight * fraction, 2)
          expect(bounds.bottom).to.be.at.least(viewportTop + element.clientHeight)
        })
      }
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
      // Wait for Ionic to finish leaving the page before navigating back.
      cy.get('.block-toolbar').closest('.ion-page').should('have.class', 'ion-page-hidden')
      cy.contains('ion-tab-button', 'Eingabe').click()
      expectGroup('abcde')
      // A small expansion leaves ABCDE dominant; a larger one makes EINSATZ dominant.
      scrollContent().invoke('css', 'overflow-anchor', 'none')
      scrollContent().then($scroll => {
        cy.get('[data-doku-group="einsatz"]').invoke('css', 'padding-bottom', `${$scroll[0].clientHeight * 0.3}px`)
      })
      expectGroup('abcde')
      scrollContent().then($scroll => {
        cy.get('[data-doku-group="einsatz"]').invoke('css', 'padding-bottom', `${$scroll[0].clientHeight * 0.7}px`)
      })
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
