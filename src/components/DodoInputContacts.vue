<template>

  <ion-card class="dodo-contact-input" v-if="hasContacts">
    <ion-card-content class="dodo-contact-input-content">
      <ion-list>
        <ion-item v-for="(contact, index) in modelValue.contacts" :key="getContactKey(contact, index)"
          lines="none" button @click="editContact(contact)">
          <ion-label>{{ contact.contactName || 'Angehöriger' }}</ion-label>
          <ion-note slot="end">{{ contact.telephone }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-card-content>
  </ion-card>
  <ion-card class="dodo-contact-input">
    <ion-card-content class="dodo-contact-input-content dodo-contact-input-actions">
      <ion-button fill="solid" color="light" @click="addContact">
        <ion-icon slot="start" :icon="addCircle"></ion-icon>
        Kontakt hinzufügen
      </ion-button>
    </ion-card-content>
  </ion-card>

  <ion-modal :is-open="isModalOpen" @did-present="focusNameInput">
    <ion-header>
      <ion-toolbar>
        <ion-title type="ios">{{ modalTitle }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="cancelEdit">Zurück</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="saveContact" color="success" :disabled="!modalValid">{{ modalSaveLabel }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item-divider>
          <ion-label>Angehöriger</ion-label>
        </ion-item-divider>
        <ion-item lines="none">
          <DodoInputText ref="inputName"
            v-model="currentContact.contactName"
            label=""
            placeholder="z.B. Ehepartner"
            :beautify-fn="basicCap">
          </DodoInputText>
        </ion-item>
        <ion-item-divider>
          <ion-label>Telefon</ion-label>
        </ion-item-divider>
        <ion-item lines="none">
          <DodoInputText
            v-model="currentContact.telephone"
            label=""
            placeholder="z.B. 0151 23456789"
            inputmode="tel"
            :beautify-fn="correctPhone"
            type="tel">
          </DodoInputText>
        </ion-item>
      </ion-list>
      <ion-button @click="deleteContact" v-if="!currentNew"
        expand="block" fill="outline" color="danger" style="margin: 1rem;">Entfernen
      </ion-button>
    </ion-content>
  </ion-modal>

</template>

<script setup lang="ts">

import DodoInputText from './DodoInputText.vue'

import { computed, ref } from 'vue'
import type { UnwrapRef } from 'vue'

import { addCircle } from 'ionicons/icons'

import { correctPhone } from '@/utils/autocorrect/telephone'
import { basicCap } from '@/utils/autocorrect/basic'

import { SampleContactsItem, SampleContacts } from '@/types/protocol/sample'
type ContactsModel = SampleContacts | UnwrapRef<SampleContacts>

const props = defineProps<{ modelValue: ContactsModel }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: ContactsModel): void
}>()

const hasContacts = computed(() => props.modelValue.contacts.length > 0)

const cloneModelValue = (): ContactsModel => {
  const clone = Object.assign(new SampleContactsItem(), props.modelValue)
  clone.contacts = props.modelValue.contacts.map((contact) => new SampleContactsItem(contact))
  return clone
}

const isModalOpen = ref(false)
const currentNew = ref(true)
const currentIndex = ref<number>(-1)
const currentContact = ref<SampleContactsItem>(new SampleContactsItem())

const inputName = ref<any|null>(null)

const focusNameInput = async () => {
  setTimeout(() => { inputName.value?.setFocus?.() }, 300)
}

const addContact = () => {
  currentNew.value = true
  currentContact.value = new SampleContactsItem()
  currentIndex.value = -1
  isModalOpen.value = true
}

const editContact = (contact: SampleContactsItem) => {
  currentNew.value = false
  currentContact.value = new SampleContactsItem(contact)
  currentIndex.value = props.modelValue.contacts.indexOf(contact)
  isModalOpen.value = true
}

const cancelEdit = () => {
  currentNew.value = true
  currentContact.value = new SampleContactsItem()
  currentIndex.value = -1
  isModalOpen.value = false
}

const saveContact = () => {
  if (!modalValid.value) return

  currentContact.value.contactName = basicCap(currentContact.value.contactName)
  currentContact.value.telephone = correctPhone(currentContact.value.telephone)

  const updated = cloneModelValue()
  if (currentNew.value) {
    updated.contacts = [...updated.contacts, currentContact.value]
  } else if (currentIndex.value >= 0) {
    updated.contacts[currentIndex.value] = currentContact.value
  }

  emit('update:modelValue', updated)
  isModalOpen.value = false
}

const deleteContact = () => {
  if (currentIndex.value < 0) return
  const updated = cloneModelValue()
  updated.contacts.splice(currentIndex.value, 1)
  emit('update:modelValue', updated)
  isModalOpen.value = false
}

const modalTitle = computed(() => {
  return currentNew.value
    ? 'Neuer Kontakt'
    : (currentContact.value.contactName.trim().length > 0 ? currentContact.value.contactName : 'Kontakt')
})

const modalValid = computed(() => {
  if (currentContact.value.contactName.trim().length === 0) return false
  return /\d/.test(currentContact.value.telephone)
})

const modalSaveLabel = computed(() => currentNew.value ? 'Hinzufügen' : 'Speichern')

const getContactKey = (contact: SampleContactsItem, index: number) => {
  return `${contact.contactName}-${contact.telephone}-${index}`
}
</script>

<style scoped>

.dodo-contact-input {
  --card-bg: transparent;
  margin: .25rem;
}
.dodo-contact-input-content {
  padding: 0;
}

.dodo-contact-input-actions {
  display: flex;
  justify-content: flex-start;
}
</style>
