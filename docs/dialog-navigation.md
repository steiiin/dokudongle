# Dialog navigation audit

The app has 21 custom `IonModal` declarations in 20 components. Reused components cover additional instances and data-driven Quickies.

Full-screen task dialogs use a leading X (`closeOutline`) to cancel or dismiss and a trailing text action to commit. Live-edit dialogs use a leading `chevronBackOutline` labelled “Zurück”: leaving retains changes. Icons have German accessible labels and tooltips. Navigation and primary actions share the first header toolbar.

This follows [Material's full-screen dialog guidance](https://m1.material.io/components/dialogs.html#dialogs-full-screen-dialogs). Basic alerts and selection overlays have different action patterns.

## Custom modal inventory

| Component / dialog | Leading action | Trailing primary action |
| --- | --- | --- |
| `DodoInputContacts` — add/edit contact | X: cancel | Add / Save |
| `DodoMedInput` — add/edit medication, including free text | X: cancel | Add / Save |
| `DodoInputSaamed` — medication selection | X: cancel | None; a row opens the editor |
| `DodoInputSaamed` — medication editor | X: cancel | Save |
| `SampleSymptomsTrauma` — add/edit injury | X: cancel | Add / Save |
| `DongleSettingsCard` — settings | X: cancel, disabled while busy | Save, subject to existing validation |
| `DodoQuickieOPRST` | X: cancel | Insert |
| `DodoQuickieAbdomonalPain` | X: cancel | Insert |
| `DodoQuickieSchwindel` | X: cancel | Insert |
| `DodoQuickieSchwangerschaft` | X: cancel | Insert |
| `DodoQuickieExcretionsUrinary` | X: cancel | Insert |
| `DodoQuickieExcretionsBowels` | X: cancel | Insert |
| `DodoQuickieTemplate` — all template-based Quickies | X: cancel | Insert |
| `DodoInputRedflags` — scenarios / warning signs | X: cancel | None; a row adds the selection |
| `DodoProtocolCheckModal` | X: close, disabled during checking | Send anyway, only in the existing eligible send flow |
| `DodoFirmwareUpdate` | X: cancel confirmation or dismiss an inactive result | Proceed during confirmation; Retry after an error |
| `DodoInputTextArea` — shared text editor | Back: retains and flushes edits | None |
| `DodoItemModal` — clinical details | Back: retains edits | None |
| `DodoInputSampleLimb` — limb / pDMS details | Back: retains edits | None |
| `DodoUserDictionaryModal` | Back: retains saved entries | None; Add / Remove operate on individual entries |
| `DodoTextAssistEntriesModal` — shortcuts / locations | Back: retains saved entries, disabled while busy | No whole-dialog commit; Reset remains a secondary action |

## Exceptions to a cancel/save pair

- **Live clinical details:** Mundschleimhaut, Atemmechanik, Auskultation, Thoraxbefunde, Hautbefund, Puls, EKG, Brustschmerz, Orientierung (adult and pediatric), GCS, Psych-Befund, Ausscheidung, Erbrechen, and Bauchbefund use `DodoItemModal`. Their controls update the protocol directly, so Back must not imply rollback.
- **Limb details:** left/right arm and left/right leg update injury and pDMS data immediately. Back retains those changes.
- **Text editor:** typing snapshots, blur, and dismissal already commit text. Back replaces the misleading “Speichern” label without changing persistence, undo history, text assistance, or cleanup.
- **Dictionary, shortcuts, and locations:** Add / Remove / Reset persist independently. Back does not undo those operations; unfinished entry fields are not implicitly submitted.
- **SAA and RedFlag pickers:** selecting an item advances the flow or adds it immediately. An extra confirmation button is unnecessary.
- **Protocol-check results:** outside an eligible send flow, there is no positive action to commit. Retry remains next to an error; closing is disabled while checking.
- **Firmware activity / unknown native status:** no general close action is offered while an update is active or its native status cannot be read. Discovery cancellation, device selection, and status reload retain their existing behavior. Confirmation can still be cancelled; inactive results can be dismissed.
- **Basic alerts:** “Dongle-Verbindung fehlgeschlagen”, “Neues Protokoll”, “Fehlende Eingaben”, and “Eingaben löschen” retain Ionic's standard acknowledgment/confirmation actions. They are not full-screen task dialogs.
- **Selection overlays:** select popovers (including medication times and pDMS) and chip popovers remain contextual selection controls rather than full-screen dialogs.
- **Platform UI:** Bluetooth device selection, permission prompts, and Android's export file chooser are controlled by the browser or operating system.

Existing persistence, validation, events, busy guards, and dismissal restrictions are preserved. This change does not add a draft/rollback system or a new discard-confirmation policy.
