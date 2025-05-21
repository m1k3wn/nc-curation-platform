export default function DeleteConfirmation({
  onCancel,
  onConfirm,
  itemName = "item",
}) {
  return (
    <div className="mt-2 bg-red-50 p-3 rounded-md">
      <p className="text-sm text-red-700 mb-2">
        Are you sure you want to delete this {itemName}? This action cannot be
        undone.
      </p>
      <div className="flex space-x-2 justify-end">
        <button
          className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 text-xs bg-red-600 text-white rounded"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
