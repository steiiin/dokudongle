interface DokuStore {
  doku: { situation: { setText(text: string): void }; treatment: { setText(text: string): void } }
  connection: { isConnected: boolean; device: { id: string; name: string }; isTransmitting: boolean; transmissionLength: number; transmissionCurrent: number }
  lastProtocolSentAt: string | null
  sendProtocol(text?: string, options?: { groupId?: string; revision?: string }): Promise<boolean>
  markOutputGroupSent(id: string, revision: string, protocol: DokuStore['doku']): Promise<void>
  newProtocol(): Promise<void>
}
const modal = () => cy.get('ion-modal:visible')
const openLayout = () => cy.contains('ion-item', 'Gliederung bearbeiten').click()
const getStore = () => cy.get('#app').then(element => {
  const app = element[0] as HTMLElement & {
    __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, DokuStore> } } } }
  }
  return app.__vue_app__.config.globalProperties.$pinia._s.get('doku')!
})

function dragRow(from: string, to: string) {
  modal().find(`[data-output-row="${from}"] ion-reorder`).then(handle => {
    const start = handle[0].getBoundingClientRect()
    modal().find(`[data-output-row="${to}"]`).then(target => {
      const end = target[0].getBoundingClientRect()
      const pointer = { eventConstructor: 'MouseEvent', composed: true, button: 0, clientX: start.x + start.width / 2 }
      cy.wrap(handle).trigger('mousedown', { ...pointer, buttons: 1, clientY: start.y + start.height / 2 })
      cy.wrap(handle).closest('ion-item').should('have.class', 'reorder-selected')
      cy.document().trigger('mousemove', { ...pointer, buttons: 1, clientY: end.top + end.height / 2 })
      cy.wrap(handle).closest('ion-item').should('have.attr', 'style').and('contain', 'translateY')
      cy.document().trigger('mouseup', { ...pointer, clientY: end.top + end.height / 2 })
    })
  })
}

describe('separated output', () => {
  beforeEach(() => {
    cy.visit('/tabs/settings')
    cy.get('[data-testid="separated-output-settings"]').should('be.visible')
    cy.window().then(win => win.Function(`return Promise.all([
      import('/src/store/output-settings.ts'), import('/src/utils/separated-output.ts')
    ]).then(([settings, output]) => settings.useOutputSettingsStore().save(output.defaultOutputSettings()))`)())
    getStore().then(store => store.newProtocol())
  })
  for (const width of [320, 375]) {
    it(`edits, cancels, reorders and persists groups at ${width}px`, () => {
      cy.viewport(width, 1000)
      cy.get('[data-testid="separated-output-settings"]').should('be.visible')
      openLayout()
      modal().find('ion-input input').first().clear().type('DISCARDED')
      modal().find('ion-buttons[slot="start"] ion-button').click()
      openLayout()
      modal().find('ion-input input').first().should('have.value', 'ANAMNESE')
      modal().find('ion-input input').first().clear().type('BEFUND')
      dragRow('situation', 'abcde')
      modal().find('[data-output-row]').should(rows => {
        const ids = [...rows].map(row => row.getAttribute('data-output-row'))
        expect(ids.indexOf('situation')).to.be.greaterThan(ids.indexOf('abcde'))
      })
      dragRow('group:course', 'group:measures')
      modal().find('ion-input input').eq(1).should('have.value', 'VERLAUF')
      modal().contains('ion-button', 'Überschrift hinzufügen').click()
      modal().find('ion-input input').last().type('ZUSATZ')
      modal().contains('ion-button', 'Speichern').should('have.attr', 'color', 'success').click()
      cy.get('[data-testid="separated-output-settings"] ion-toggle').click()
      cy.reload()
      cy.get('[data-testid="separated-output-settings"] ion-toggle').should('have.prop', 'checked', true)
      openLayout()
      modal().find('ion-input input').first().should('have.value', 'BEFUND')
      modal().find('ion-input input').last().should('have.value', 'ZUSATZ')
      modal().find('[data-output-row]').should('have.length', 13)
      cy.screenshot(`separated-output-layout-${width}`)
    })
  }

  it('keeps the transmission controls reachable and reopens the checked group selection', () => {
    cy.viewport(375, 812)
    cy.get('[data-testid="separated-output-settings"] ion-toggle').click()
    // Isolate UI behavior from the external checker and Bluetooth hardware.
    cy.window().then(win => win.Function('return import("/src/services/protocol-check.ts")')()
      .then((module: { default: { getCachedResult(): Promise<unknown> } }) => {
        Cypress.sinon.stub(module.default, 'getCachedResult').resolves({ status: 'ok', issues: [] })
      }))
    getStore().then(store => {
      store.doku.situation.setText('Testanamnese.')
      store.doku.treatment.setText('Testverlauf.')
      store.connection.isConnected = true
      store.connection.device = { id: 'test', name: 'Testdongle' }
      Cypress.sinon.stub(store, 'sendProtocol').callsFake(async (_text, options) => {
        store.connection.isTransmitting = true
        store.connection.transmissionLength = 100
        store.connection.transmissionCurrent = 50
        await new Promise(resolve => setTimeout(resolve, 1200))
        await store.markOutputGroupSent(options!.groupId!, options!.revision!, store.doku)
        store.connection.isTransmitting = false
        return true
      })
    })
    cy.contains('ion-tab-button', 'Vorschau').click()
    cy.contains('ion-button:visible', 'Senden').click()
    cy.get('ion-popover:visible').find('[data-output-group="anamnesis"]').click()
    cy.get('.transmission').should('be.visible')
    cy.get('ion-popover:visible').should('not.exist')
    cy.get('.transmission').contains('ion-button', 'Pause').should('be.visible')
    cy.get('ion-popover:visible').find('[data-output-group="anamnesis"]', { timeout: 6000 })
      .shadow().find('button').should('have.attr', 'aria-label', 'ANAMNESE: Gesendet')
    cy.get('ion-popover:visible').find('[data-output-group="course"]').shadow().find('button')
      .should('have.attr', 'aria-label', 'VERLAUF: Noch nicht gesendet')
    getStore().then(store => expect(store.lastProtocolSentAt).to.equal(null))
    cy.screenshot('separated-output-sent-status')
  })
})
