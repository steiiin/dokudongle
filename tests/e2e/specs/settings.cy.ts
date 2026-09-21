describe('Dongle settings on mobile', () => {
  for (const width of [320, 375]) {
    it(`connects and renames inline at ${width}px without leaving settings`, () => {
      cy.viewport(width, 812)
      cy.visit('/tabs/settings', {
        onBeforeLoad(win) {
          // Exercise the real store and BLE adapter using a simulated browser device.
          const device = Object.assign(new win.EventTarget(), {
            id: 'settings-test-dongle',
            name: 'DokuDongle-Test123',
            gatt: {
              connected: false,
              async connect() { this.connected = true },
              disconnect() {
                if (!this.connected) return
                this.connected = false
                device.dispatchEvent(new win.Event('gattserverdisconnected'))
              },
              async getPrimaryService() {
                return {
                  async getCharacteristic() {
                    return {
                      async writeValueWithResponse(value: DataView) {
                        device.name = `DokuDongle-${new TextDecoder().decode(value)}`
                      },
                    }
                  },
                }
              },
            },
          })
          Object.defineProperty(win.navigator, 'bluetooth', {
            configurable: true,
            value: {
              getAvailability: async () => true,
              getDevices: async () => [device],
              requestDevice: async () => device,
            },
          })
        },
      })

      cy.contains('ion-toolbar ion-button', 'Verbinden')
        .should('be.visible')
        .shadow().find('button')
        .should('have.css', 'background-color', 'rgb(244, 245, 248)')
      cy.contains('ion-toolbar ion-button', 'Verbinden').click()
      cy.contains('ion-card-subtitle', 'DokuDongle-Test123').should('be.visible')
      cy.location('pathname').should('eq', '/tabs/settings')
      cy.get('ion-card input').should('have.value', 'Test123')
      cy.contains('ion-card ion-button', 'Speichern').should('have.attr', 'disabled')
      cy.get('ion-card input').clear().type('Mobile123')
      cy.contains('ion-card ion-button', 'Speichern').click()
      cy.get('ion-card ion-progress-bar').should('be.visible')
      cy.contains('ion-card-subtitle', 'DokuDongle-Mobile123', { timeout: 10000 }).should('be.visible')
      cy.get('ion-card input').should('have.value', 'Mobile123')
      cy.contains('ion-card ion-button', 'Speichern').should('have.attr', 'disabled')
      cy.location('pathname').should('eq', '/tabs/settings')
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('.with-badge .badge').should('be.visible').then(badge => {
        expect(badge[0].getBoundingClientRect().width).to.be.at.least(16)
      })
      cy.get('ion-card').then(card => {
        const bounds = card[0].getBoundingClientRect()
        expect(bounds.left).to.be.at.least(0)
        expect(bounds.right).to.be.at.most(width)
        expect(card[0].scrollWidth).to.be.at.most(card[0].clientWidth)
      })
      cy.screenshot(`settings-connected-${width}`)
    })
  }
})
