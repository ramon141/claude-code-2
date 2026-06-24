interface ButtonActionsModalProps {
  onCancel: () => void
  onSubmit: () => void
  sx?: object
  isEditing?: boolean
  isDisabled?: boolean
}

export default function ButtonActionsModal({
  onCancel, onSubmit, isEditing = false, isDisabled = false,
}: ButtonActionsModalProps) {
  return (
    <div className="flex justify-end mt-6 gap-2 w-full">
      <button
        type="button"
        onClick={onCancel}
        className="border border-[#e36565] text-[#e36565] px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
      >
        {isDisabled ? 'Fechar' : 'Cancelar'}
      </button>

      {!isDisabled && (
        <button
          type="submit"
          onClick={onSubmit}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-hover transition-colors"
        >
          {isEditing ? 'Salvar' : 'Cadastrar'}
        </button>
      )}
    </div>
  )
}
