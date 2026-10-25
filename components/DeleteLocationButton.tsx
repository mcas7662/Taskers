'use client'

export default function DeleteLocationButton({ label, confirmText }: { label: string; confirmText: string }) {
  return (
    <button
      type="submit"
      className="btn-danger min-h-9 px-3 py-1 text-sm"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault()
      }}
    >
      {label}
    </button>
  )
}
