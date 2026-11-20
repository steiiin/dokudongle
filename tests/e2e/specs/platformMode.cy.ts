const page = '.ion-page:not(.ion-page-hidden)'
const header = `${page} > ion-header`
const content = `${page} > ion-content`
const platforms = [
  { name: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', touch: true, mode: 'ios' },
  { name: 'iPad', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15', touch: true, mode: 'ios' },
  { name: 'Mac desktop', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15', touch: false, mode: 'md' },
  { name: 'Android', userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Mobile', touch: true, mode: 'md' },
]

const expectMaterial = (selector: string) => cy.get(selector).should('have.length.at.least', 1).each(element => {
  cy.wrap(element).should('have.class', 'md').and('not.have.class', 'ios')
})

describe('App platform styling', () => {
  for (const platform of platforms) {
    it(`keeps Material outside the main top bars on ${platform.name}`, () => {
      cy.viewport(320, 812)
      cy.visit('/', {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'userAgent', { configurable: true, value: platform.userAgent })
          const matchMedia = win.matchMedia.bind(win)
          cy.stub(win, 'matchMedia').callsFake((query: string) => {
            const result = matchMedia(query)
            if (query === '(any-pointer:coarse)') {
              Object.defineProperty(result, 'matches', { value: platform.touch })
            }
            return result
          })
        },
      })
      cy.get('html').should('have.attr', 'mode', 'md')
        .and(platform.mode === 'ios' ? 'have.class' : 'not.have.class', 'plt-ios')
      expectMaterial('ion-app, ion-router-outlet, ion-tab-bar, ion-tab-button')
      expectMaterial(`${content} ion-input, ${content} ion-card, ${content} ion-chip`)

      cy.get(`${content} > .block-toolbar`).should('be.visible').should(bars => {
        const bar = bars[0].getBoundingClientRect()
        const toolbar = bars[0].closest('.ion-page')!.querySelector('ion-header')!.getBoundingClientRect()
        const card = bars[0].ownerDocument.querySelector('[data-doku-group="einsatz"] > ion-card')!.getBoundingClientRect()
        expect(bar.top).to.be.greaterThan(toolbar.bottom)
        expect(card.top - bar.bottom).to.be.closeTo(8, 1)
      })

      for (const title of ['Eingabe', 'Vorschau', 'Einstellungen']) {
        cy.contains('ion-tab-button', title).click()
        cy.contains(`${header} ion-title`, title).should('be.visible')
        cy.get(`${header} ion-title`).shadow().find('.toolbar-title').should(titles => {
          const element = titles[0]
          const bounds = element.getBoundingClientRect()
          const actions = element.getRootNode() as ShadowRoot
          const buttons = actions.host.closest('ion-toolbar')!.querySelector('ion-buttons')!.getBoundingClientRect()
          expect(bounds.width).to.be.greaterThan(0)
          expect(element.scrollWidth).to.be.at.most(element.clientWidth)
          expect(bounds.right).to.be.at.most(buttons.left)
        })
        cy.get(`${header}, ${header} ion-toolbar, ${header} ion-title, ${header} ion-button`).each(element => {
          cy.wrap(element).should('have.class', platform.mode)
        })
        expectMaterial(content)
        cy.get(`${header} ion-button`).each(button => {
          cy.wrap(button).should('be.visible')
          const bounds = button[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(320)
        })
        cy.get(content).should(elements => {
          const bounds = elements[0].getBoundingClientRect()
          const headerBounds = elements[0].closest('.ion-page')!.querySelector('ion-header')!.getBoundingClientRect()
          expect(bounds.top).to.be.at.least(headerBounds.bottom)
        })
      }

      // Exercise a normal modal, then overlays launched from the adaptive header.
      cy.contains('ion-item', 'Gliederung bearbeiten').click()
      expectMaterial('ion-modal:visible, ion-modal:visible ion-header, ion-modal:visible ion-toolbar, ion-modal:visible ion-input')
      cy.get('ion-modal:visible ion-buttons[slot="start"] ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.window().then(win => win.Function(`return Promise.all([
        import('/src/store/doku.ts'), import('/src/store/output-settings.ts'),
        import('/src/utils/separated-output.ts'), import('/src/services/protocol-check.ts')
      ]).then(async ([doku, settings, output, check]) => {
        await settings.useOutputSettingsStore().save({ ...output.defaultOutputSettings(), enabled: true });
        const store = doku.useDokuStore();
        await store.newProtocol();
        store.doku.situation.setText('Testanamnese.');
        store.connection.isConnected = true;
        store.connection.device = { id: 'mode-test', name: 'Testdongle' };
        return check.default;
      })`)().then((service: { getCachedResult(): Promise<unknown> }) => {
        // Keep the real UI flow without contacting the checker or Bluetooth hardware.
        Cypress.sinon.stub(service, 'getCachedResult').resolves({
          status: 'warning',
          issues: [{ type: 'context_gap', severity: 'low', confidence: 0.9, message: 'Testhinweis', evidence: [], check: 'Test' }],
        })
      }))
      cy.contains('ion-tab-button', 'Eingabe').click()
      cy.contains(`${header} ion-button`, 'Neu').click()
      expectMaterial('ion-alert:visible')
      cy.contains('ion-alert button', 'Abbrechen').click()
      cy.get('ion-alert').should('not.exist')
      cy.contains(`${header} ion-button`, 'Senden').click()
      expectMaterial('ion-alert:visible')
      cy.contains('ion-alert button', 'Ja').click()
      cy.get('ion-alert').should('not.exist')
      expectMaterial('ion-modal:visible, ion-modal:visible ion-header, ion-modal:visible ion-toolbar, ion-modal:visible ion-title, ion-modal:visible ion-button')
      cy.contains('ion-modal:visible ion-button', 'Trotzdem senden').click()
      cy.get('ion-modal:visible').should('not.exist')
      expectMaterial('ion-popover:visible, ion-popover:visible ion-list, ion-popover:visible ion-item')
    })
  }
})
