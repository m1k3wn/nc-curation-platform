import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collectionData from "../../utils/collectionsList.json";

const collections = collectionData.collections;

const CascadeAnimation = () => {
  const [visibleItems, setVisibleItems] = useState([]);
  const navigate = useNavigate();

  const handleCollectionClick = (collectionName) => {
    navigate(`/search?q=${encodeURIComponent(collectionName)}`);
  };

  useEffect(() => {
    setVisibleItems([]);

    const groupSize = 2;
    const delay = 75;

    for (let i = 0; i < collections.length; i += groupSize) {
      const groupIndex = Math.floor(i / groupSize);
      setTimeout(() => {
        setVisibleItems((prev) => {
          const newItems = [];
          for (
            let j = i;
            j < Math.min(i + groupSize, collections.length);
            j++
          ) {
            newItems.push(j);
          }
          return [...prev, ...newItems];
        });
      }, groupIndex * delay);
    }
  }, []);

  return (
    <div className="text-center py-6">
      <h2 className="text-subtitle mb-4">Discover treasures from: </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 max-w-full mx-auto">
        {collections.map((name, index) => (
          <div
            key={index}
            onClick={() => handleCollectionClick(name)}
            className={`text-body text-ml btn-action px-3 transition-all duration-200 ease-out ${
              visibleItems.includes(index)
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-4"
            }`}
          >
            {name}
          </div>
        ))}
      </div>
      <p className="text-gray-500 mt-8 text-sm">
        Click any collection to start exploring
      </p>
    </div>
  );
};

export default CascadeAnimation;
