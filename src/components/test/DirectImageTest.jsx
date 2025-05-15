import { useState } from "react";

export default function DirectImageTest() {
  const [showImages, setShowImages] = useState(false);

  // Sample IDs to test
  const testIds = [
    "CHSDM-9BFC7BDCAAE92-000001",
    "NASM-NASM2015-02874",
    "NMAAHC-2015.167.1",
    "NPG-NPG_68_27",
    "SAAM-1986.65.115_1",
  ];

  // Test formats to try
  const formats = ["download", "deliveryService", "media", "image"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Direct Image URL Test</h1>
      <p className="mb-4">
        This tests direct access to Smithsonian image URLs with various formats.
      </p>

      <button
        onClick={() => setShowImages(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
      >
        Show Test Images
      </button>

      {showImages && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testIds.map((id) => (
            <div key={id} className="border rounded p-4">
              <h2 className="font-medium mb-2">ID: {id}</h2>

              {formats.map((format) => {
                const url = `https://ids.si.edu/ids/${format}?id=${id}`;

                return (
                  <div key={format} className="mb-6 border-b pb-4">
                    <p className="text-sm font-medium">{format}:</p>
                    <p className="text-xs mb-2 break-all">{url}</p>

                    <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                      <img
                        src={url}
                        alt={`${format} for ${id}`}
                        className="max-h-full object-contain"
                        onLoad={() => console.log(`Image loaded: ${url}`)}
                        onError={() => console.log(`Image failed: ${url}`)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
