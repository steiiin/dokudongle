describe('Dongle settings on mobile', () => {
  for (const width of [320, 375]) {
    it(`reads, cancels, and saves complete settings at ${width}px`, () => {
      cy.viewport(width, 812)
      cy.visit('/tabs/settings', {
        onBeforeLoad(win) {
          // Simulate persisted config and a firmware restart through the real BLE adapter.
          let saved = { name: 'Test123', keyGapMs: 30 }
          const characteristic = {
            uuid: '00000883-0000-1000-8000-00805f9b34fb',
            properties: { read: true, write: true },
            getDescriptors: async () => [],
            async readValue() {
              const view = new win.DataView(new win.ArrayBuffer(2 + saved.name.length))
              view.setUint16(0, saved.keyGapMs, true)
              for (let i = 0; i < saved.name.length; i++) view.setUint8(i + 2, saved.name.charCodeAt(i))
              return view
            },
            async writeValueWithResponse(value: DataView) {
              const keyGapMs = value.getUint16(0, true)
              let name = ''
              for (let i = 2; i < value.byteLength; i++) name += String.fromCharCode(value.getUint8(i))
              win.setTimeout(() => {
                saved = { name, keyGapMs }
                device.gatt.disconnect()
              }, 100)
            },
          }
          const service = {
            uuid: '00001888-0000-1000-8000-00805f9b34fb',
            getCharacteristics: async () => [characteristic],
            getCharacteristic: async () => characteristic,
          }
          const device = Object.assign(new win.EventTarget(), {
            id: 'settings-test-dongle',
            name: 'DokuDongle-StaleAdvertisement',
            gatt: {
              connected: false,
              async connect() { this.connected = true },
              disconnect() {
                if (!this.connected) return
                this.connected = false
                device.dispatchEvent(new win.Event('gattserverdisconnected'))
              },
              getPrimaryServices: async () => [service],
              getPrimaryService: async () => service,
            },
          })
          Object.defineProperty(win.navigator, 'bluetooth', {
            configurable: true,
            value: {
              getAvailability: async () => true,
              getDevices: async () => [device],
              requestDevice: cy.stub().as('requestDongle').resolves(device),
            },
          })
        },
      })

      cy.contains('ion-toolbar ion-button', 'Verbinden').shadow().find('button')
        .should('have.css', 'background-color', 'rgb(244, 245, 248)')
      cy.contains('ion-toolbar ion-button', 'Verbinden').click()
      cy.get('[data-testid="dongle-settings"]').as('settingsCard')
      cy.get('@settingsCard').should('contain.text', 'DokuDongle-Test123').and('contain.text', '30 ms')
      cy.get('@settingsCard').find('input, ion-range').should('not.exist')
      cy.contains('ion-button', 'Einstellungen ändern').click()
      cy.get('ion-modal').should('be.visible')
      cy.get('ion-modal:visible ion-input input').should('have.value', 'Test123').clear().type('Unsaved')
      cy.get('[data-testid="cancel-settings"]').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@settingsCard').should('contain.text', 'DokuDongle-Test123')

      const save = () => {
        cy.get('[data-testid="save-settings"]').click()
        cy.get('ion-modal ion-progress-bar').should('be.visible')
        cy.get('ion-modal:visible', { timeout: 10000 }).should('not.exist')
      }
      // Name-only save preserves the gap.
      cy.contains('ion-button', 'Einstellungen ändern').click()
      cy.get('ion-modal:visible ion-input input').should('have.value', 'Test123').clear().type('Mobile123')
      save()
      cy.get('@settingsCard').should('contain.text', 'DokuDongle-Mobile123').and('contain.text', '30 ms')

      // Gap-only save preserves the name; exercise the real slider keyboard control.
      cy.contains('ion-button', 'Einstellungen ändern').click()
      cy.get('ion-range').shadow().find('[role="slider"]').focus().type('{rightarrow}')
      cy.get('ion-range').should('have.prop', 'value', 40)
      save()
      cy.get('@settingsCard').should('contain.text', 'DokuDongle-Mobile123').and('contain.text', '40 ms')

      // Save both settings and check mobile layout at the longest permitted suffix.
      cy.contains('ion-button', 'Einstellungen ändern').click()
      cy.get('ion-modal:visible ion-input input').clear().type('Ab012345678901234Z')
      cy.get('ion-range').shadow().find('[role="slider"]').focus().type('{rightarrow}'.repeat(16))
      cy.get('ion-range').should('have.prop', 'value', 200)
      cy.get('ion-modal ion-card').each(card => {
        const bounds = card[0].getBoundingClientRect()
        expect(bounds.left).to.be.at.least(0)
        expect(bounds.right).to.be.at.most(width)
        expect(card[0].scrollWidth).to.be.at.most(card[0].clientWidth)
      })
      cy.screenshot(`settings-modal-${width}`)
      save()
      cy.get('@settingsCard').should('contain.text', 'DokuDongle-Ab012345678901234Z').and('contain.text', '200 ms')
      cy.get('@requestDongle').should('have.been.calledOnce')
      cy.location('pathname').should('eq', '/tabs/settings')
      cy.screenshot(`settings-connected-${width}`)
    })
  }
})
