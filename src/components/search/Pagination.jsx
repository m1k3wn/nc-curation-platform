// src/components/search/Pagination.jsx
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Calculate which page buttons to show
  const pages = [];
  const maxButtonsToShow = 5;

  if (totalPages <= maxButtonsToShow) {
    // Show all pages if there are few
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show a subset with current page in the middle
    pages.push(1); // Always show first page

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(currentPage + 1, totalPages - 1);

    // Add ellipsis if needed
    if (start > 2) {
      pages.push("...");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages); // Always show last page
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      {/* Previous page button */}
      <button
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>

      {/* Page buttons */}
      {pages.map((page, index) => (
        <button
          key={index}
          className={`px-3 py-1 rounded ${
            page === currentPage
              ? "bg-blue-500 text-white"
              : page === "..."
              ? "bg-gray-100 text-gray-500 cursor-default"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => page !== "..." && onPageChange(page)}
          disabled={page === "..."}
        >
          {page}
        </button>
      ))}

      {/* Next page button */}
      <button
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    </div>
  );
}
