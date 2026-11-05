<template>
  <IonCard>
    <IonCardHeader><IonCardTitle>{{ title }}</IonCardTitle></IonCardHeader>
    <IonCardContent><IonList lines="none"><GroupedExaminations /></IonList></IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { cloneVNode, Comment, Fragment, Text, useSlots, type VNode } from 'vue'
import DodoExaminationItem from './DodoExaminationItem.vue'
import DodoInputToggleOptional from './DodoInputToggleOptional.vue'

defineProps<{ title: string }>()
const slots = useSlots()
const sourceKeys = new Map<string, symbol>()

// Only flatten template fragments. Component slots (especially modal contents)
// retain their own rendering and order.
function keyedRows(nodes: VNode[], parent = ''): VNode[] {
  return nodes.flatMap((node, index) => {
    const path = `${parent}/${index}`
    if (node.type === Fragment && Array.isArray(node.children)) {
      return keyedRows(node.children as VNode[], path)
    }
    if (node.key != null) return [node]
    if (!sourceKeys.has(path)) sourceKeys.set(path, Symbol(path))
    return [cloneVNode(node, { key: sourceKeys.get(path) })]
  })
}

function isInactive(node: VNode) {
  if (node.type === DodoExaminationItem) return !node.props?.assessed
  if (node.type === DodoInputToggleOptional) return !node.props?.modelValue
  return false
}

function isVisibleRow(node: VNode) {
  return node.type !== Comment && node.type !== Text &&
    !(node.type === DodoExaminationItem && node.props?.available === false)
}

const GroupedExaminations = () => {
  // Keys refer to source positions, never sorted positions or examination IDs:
  // the adult and pediatric orientation rows deliberately share an ID.
  const rows = keyedRows(slots.default?.() ?? [])
  const ordered = [...rows.filter(node => !isInactive(node)), ...rows.filter(isInactive)]
  const last = ordered.filter(isVisibleRow).at(-1)
  return ordered.map(node => {
    if (node.type === DodoExaminationItem) {
      return cloneVNode(node, {
        showLine: node === last ? false : (node.props?.showLine ?? node.props?.['show-line']) || 'full',
      })
    }
    if (node.type === DodoInputToggleOptional) {
      return cloneVNode(node, {
        lines: node === last ? 'none' : node.props?.lines === 'inset' ? 'inset' : 'full',
      })
    }
    return node
  })
}
</script>

<style scoped>
ion-card-content ion-list {
  padding: 0;
}
</style>
