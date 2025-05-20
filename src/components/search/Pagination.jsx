/**
 * Pagination component for search results
 *
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback when page changes
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Don't render pagination if only one page exists
  if (totalPages <= 1) return null;

  // Calculate which page buttons to show
  const pages = calculatePageButtons(currentPage, totalPages);

  return (
    <nav
      className="flex justify-center items-center space-x-2 mt-8"
      aria-label="Pagination"
    >
      {/* Previous page button */}
      <PaginationButton
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        className={currentPage === 1 ? "disabled" : ""}
      >
        &laquo;
      </PaginationButton>

      {/* Page buttons */}
      {pages.map((page, index) => (
        <PaginationButton
          key={index}
          onClick={() => page !== "..." && onPageChange(page)}
          disabled={page === "..."}
          active={page === currentPage}
          aria-label={page === "..." ? "More pages" : `Go to page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </PaginationButton>
      ))}

      {/* Next page button */}
      <PaginationButton
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        className={currentPage === totalPages ? "disabled" : ""}
      >
        &raquo;
      </PaginationButton>
    </nav>
  );
}

/**
 * Calculate which page buttons to show
 *
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @returns {Array} - Array of page numbers to display
 */
function calculatePageButtons(currentPage, totalPages) {
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

    // Calculate range around current page
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

  return pages;
}

/**
 * Reusable pagination button component
 */
function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  className = "",
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1 rounded ${
          active
            ? "bg-blue-500 text-white"
            : disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        } ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
