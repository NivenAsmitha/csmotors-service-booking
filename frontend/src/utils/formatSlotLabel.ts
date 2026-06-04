export function formatSlotLabel(label?: string | null) {
  if (!label) {
    return 'Slot'
  }

  if (label.toLowerCase().includes('super service full day')) {
    return 'Slot 1'
  }

  return label
}
