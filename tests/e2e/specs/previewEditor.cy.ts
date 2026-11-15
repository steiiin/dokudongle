export {}

describe('editable preview', () => {
  beforeEach(() => {
    cy.viewport(390, 844)
    cy.visit('/tests/e2e/fixtures/previewEditor.html')
  })

  it('updates selectable differences while typing without blur or regeneration', () => {
    cy.get('[data-difference-id]').click()
    cy.contains('ion-popover ion-button', 'Generierten Text wiederherstellen').click()
    cy.get('[data-difference-id]').should('not.exist')
    cy.get('ion-popover').should('have.class', 'overlay-hidden')
    cy.get('textarea').focus().should('have.focus').then($input => {
      ($input[0] as HTMLTextAreaElement).setSelectionRange(8, 12)
    }).type('f')
    cy.get('[data-difference-id]').should('have.text', 'f')
    cy.get('textarea').should('have.focus').type('i')
    cy.get('[data-difference-id]').should('have.text', 'fi')
    cy.get('textarea').should('have.focus').type('t')
    cy.get('[data-difference-id]').should('have.text', 'fit').click()
    cy.get('ion-popover ion-button').should('have.length', 1).and('have.attr', 'color', 'success')
    cy.contains('ion-popover ion-button', 'Generierten Text wiederherstellen').click()
    cy.get('[data-difference-id]').should('not.exist')
    cy.get('textarea').should('contain.value', 'Patient wach, ruhig.')
  })

  it('marks a manual deletion immediately and restores the generated text', () => {
    cy.get('textarea').clear()
    cy.get('.deletion').should('have.length', 1).click()
    cy.get('textarea').should('have.value', '')
    cy.get('.deletion').should($marker => {
      const marker = $marker[0]
      const rgb = getComputedStyle(marker).getPropertyValue('--ion-color-danger-rgb').trim()
      expect(getComputedStyle(marker, '::after').color).to.equal(`rgb(${rgb})`)
      expect(marker.getAttribute('data-change-type')).to.equal('deletion')
    })
    cy.get('ion-popover ion-button').should('have.length', 1).and('have.attr', 'color', 'success')
    cy.contains('ion-popover ion-button', 'Gelöschtes wiederherstellen').click()
    cy.get('[data-difference-id]').should('not.exist')
    cy.get('textarea').should('contain.value', 'Patient wach, ruhig.')
  })

  it('merges form changes, exposes tappable highlights, and restores the user version', () => {
    cy.get('textarea').should('have.value', 'Patient müde, ruhig.' + '\nWeitere Angaben bleiben unverändert.'.repeat(40))
    cy.get('#generate').click()
    cy.get('textarea').invoke('val').should('match', /^Patient schläfrig, unruhig\./)
    cy.screenshot('editable-preview-conflict-mobile')
    cy.get('[data-conflict-id]').should('have.length', 1).click()
    cy.contains('ion-popover ion-button', 'Eigener Text').click()
    cy.get('[data-conflict-id]').should('not.exist')
    cy.get('[data-difference-id]').should('have.length', 1).and('contain.text', 'müde')
    cy.get('textarea').invoke('val').should('match', /^Patient müde, unruhig\./)
  })

  it('preserves typing, selection, scrolling, and highlight alignment', () => {
    cy.get('textarea').type('{moveToStart}Heute: ')
    cy.get('#generate').click()
    cy.get('textarea').invoke('val').should('match', /^Heute: Patient schläfrig, unruhig\./)
    cy.get('textarea').then($input => {
      const input = $input[0] as HTMLTextAreaElement
      const mirror = input.parentElement!.querySelector('.text-mirror') as HTMLElement
      const style = getComputedStyle(input)
      expect(getComputedStyle(mirror).font).to.equal(style.font)
      expect(mirror.clientWidth).to.equal(input.clientWidth)
      expect(getComputedStyle(mirror).padding).to.equal(style.padding)
      input.setSelectionRange(7, 14)
      expect(input.value.slice(input.selectionStart, input.selectionEnd)).to.equal('Patient')
    })
    cy.get('textarea').scrollTo('bottom')
    cy.get('textarea').should($input => {
      const input = $input[0] as HTMLTextAreaElement
      expect(input.scrollTop).to.be.greaterThan(0)
      expect(input.parentElement!.querySelector('.text-mirror')!.scrollTop).to.equal(input.scrollTop)
    })
    cy.get('textarea').scrollTo('top')
    cy.get('[data-conflict-id]').focus().trigger('keydown', { key: 'Enter' })
    cy.contains('ion-popover ion-button', 'Neuer Text').click()
    cy.get('[data-conflict-id]').should('not.exist')
    cy.get('textarea').invoke('val').should('match', /^Heute: Patient schläfrig, unruhig\./)
  })

  it('shows a selectable deletion marker without inserting it in the text', () => {
    cy.get('#delete').click()
    cy.get('.deletion').should('exist').focus().trigger('keydown', { key: 'Enter' })
    cy.contains('ion-popover ion-button', 'Eigener Text').click()
    cy.get('textarea').invoke('val').should('match', /^Patient müde, unruhig\./)
  })

  it('accepts multiline plain text and IME composition', () => {
    cy.get('textarea').clear().type('Erste Zeile{enter}<b>Nur Text</b>')
    cy.get('.text-mirror b').should('not.exist')
    cy.get('[data-difference-id]').should('exist')
    cy.get('textarea').trigger('compositionstart').then($input => {
      ($input[0] as HTMLTextAreaElement).value += ' ä'
    }).trigger('input', { isComposing: true })
    cy.get('[data-difference-id]').should('not.exist')
    cy.get('textarea').trigger('compositionend')
    cy.get('[data-difference-id]').should('exist')
    cy.get('textarea').should('have.value', 'Erste Zeile\n<b>Nur Text</b> ä')
  })

  for (const choice of ['Eigener Text', 'Neuer Text']) {
    it(`keeps green additions separate from yellow replacements and conflicts: ${choice}`, () => {
      cy.get('#orientation').click()
      cy.get('textarea').type('{moveToEnd}added.')
      cy.get('[data-change-type="insertion"]').should('have.text', 'added.')
      cy.get('textarea').then($input => {
        ($input[0] as HTMLTextAreaElement).setSelectionRange(0, 10)
      }).type('desorientiert')
      cy.get('[data-change-type="replacement"]').should('have.text', 'desorientiert').and($marker => {
        const style = getComputedStyle($marker[0])
        expect(style.backgroundColor).to.equal(`rgba(${style.getPropertyValue('--ion-color-warning-rgb').trim()}, 0.3)`)
      })
      cy.get('[data-change-type="insertion"]').should('have.text', 'added.')
      cy.get('#qualify').click()
      cy.get('textarea').should('have.value', 'teilweise orientiert. added.')
      cy.get('[data-difference-id]').should('have.length', 2)
      cy.get('[data-change-type="insertion"]').should('have.text', 'added.').and($marker => {
        const style = getComputedStyle($marker[0])
        expect(style.backgroundColor).to.equal(`rgba(${style.getPropertyValue('--ion-color-success-rgb').trim()}, 0.3)`)
      })
      cy.get('[data-change-type="conflict"]').should('have.text', 'teilweise orientiert')
        .and($marker => {
          const style = getComputedStyle($marker[0])
          expect(style.backgroundColor).to.equal(`rgba(${style.getPropertyValue('--ion-color-warning-rgb').trim()}, 0.3)`)
        }).click()
      cy.get('ion-popover ion-button').should('have.length', 2)
      cy.contains('ion-popover ion-button', 'Eigener Text').should('have.attr', 'color', 'success')
      cy.contains('ion-popover ion-button', 'Neuer Text').should('have.attr', 'color', 'danger')
      cy.contains('ion-popover ion-button', choice).click()
      cy.get('ion-popover').should('have.class', 'overlay-hidden')
      const wording = choice === 'Eigener Text' ? 'desorientiert' : 'teilweise orientiert'
      cy.get('textarea').should('have.value', `${wording}. added.`)
      cy.get('[data-change-type="insertion"]').click()
      cy.get('ion-popover ion-button').should('have.length', 1).and('have.attr', 'color', 'danger')
      cy.contains('ion-popover ion-button', 'Eingefügtes entfernen').click()
      cy.get('textarea').should('have.value', `${wording}. `)
      cy.get('[data-change-type="insertion"]').should('not.exist')
      if (choice === 'Eigener Text') cy.get('[data-change-type="replacement"]').should('have.text', 'desorientiert')
    })
  }
})

describe('preview in the application', () => {
  it('preserves direct edits across tab changes, form updates and reload', () => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', {
      command: 'Storage.clearDataForOrigin',
      params: { origin: new URL(Cypress.config('baseUrl')!).origin, storageTypes: 'all' },
    }))
    cy.viewport(390, 844)
    cy.visit('/tabs/doku')
    cy.contains('ion-chip', 'Verlegung').then($element => $element[0].scrollIntoView({ block: 'center' }))
      .click({ scrollBehavior: false })
    for (const [label, value] of [['Start', 'Radebeul'], ['Ziel', 'Dresden']]) {
      cy.get('ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === label)
        .find('input').should($input => expect($input[0].hasAttribute('readonly')).to.equal(false))
        .then($input => $input[0].scrollIntoView({ block: 'center' }))
        .type(value, { scrollBehavior: false })
    }
    cy.contains('ion-tab-button', 'Vorschau').click()
    cy.get('textarea:visible').should('contain.value', 'Radebeul').and('contain.value', 'Dresden').then($input => {
      const textarea = $input[0] as HTMLTextAreaElement
      textarea.value = textarea.value.replace('Dresden', 'Coswig')
    }).trigger('input')
    cy.get('[data-difference-id]:visible').should('contain.text', 'Coswig')
    cy.contains('ion-tab-button', 'Eingabe').click()
    cy.get('ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === 'Start')
      .find('input').then($input => $input[0].scrollIntoView({ block: 'center' }))
      .type('{moveToEnd} Nord', { scrollBehavior: false })
    cy.contains('ion-tab-button', 'Vorschau').click()
    cy.get('textarea:visible').should('contain.value', 'Radebeul Nord').and('contain.value', 'Coswig')
      .and('not.contain.value', 'Dresden')
    // The app persists after its existing three-second idle debounce.
    cy.wait(3200)
    cy.reload()
    cy.get('[data-difference-id]:visible').should('contain.text', 'Coswig')
    cy.get('textarea:visible').should('contain.value', 'Radebeul Nord').and('contain.value', 'Coswig')
      .and('not.contain.value', 'Dresden')
  })
})
