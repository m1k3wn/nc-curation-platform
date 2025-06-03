import { useEffect, useRef, useState } from "react";

/**
 * @param {Array} items - Items to render
 * @param {Function} renderItem - Function that renders each item
 * @param {number} minItemWidth - Minimum width for each item (default: 250px)
 */
export default function MasonryGrid({ items, renderItem, minItemWidth = 250 }) {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const gap = 16; // 1rem = 16px
      const newColumns = Math.floor(
        (containerWidth + gap) / (minItemWidth + gap)
      );
      setColumns(Math.max(1, newColumns));
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [minItemWidth]);

  // Split items into columns but maintain left-to-right order
  const columnItems = Array.from({ length: columns }, () => []);

  items.forEach((item, index) => {
    const columnIndex = index % columns;
    columnItems[columnIndex].push(item);
  });

  return (
    <div
      ref={containerRef}
      className="flex gap-4"
      role="list"
      aria-label="Search results"
    >
      {columnItems.map((columnData, columnIndex) => (
        <div key={columnIndex} className="flex-1 space-y-4">
          {columnData.map((item) => (
            <div key={item.id} role="listitem">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
