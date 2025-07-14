import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

// Optional: Replace this with your actual hook import
// import useDownloader from "@/hooks/useDownloader";

interface ImageModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  downloadUrl?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  open,
  onClose,
  imageSrc,
  downloadUrl = ""
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

//   const [downloadState, download] = useDownloader(downloadUrl);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setIsImageError(false);
  };

  const handleImageError = () => {
    setIsImageLoaded(true);
    setIsImageError(true);
  };

  const handleDownload = (url: string) => {
    if (!url) return;
    // download({ Location: url });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">POD Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Image Viewer */}
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          wheel={{ step: 0.1 }}
          doubleClick={{ mode: "reset" }}
          limitToBounds={false}
          centerOnInit
          centerZoomedOut
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <div className="relative flex-1 flex items-center justify-center bg-gray-100 overflow-hidden">
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse" />
              )}

              {!isImageError && (
                <>
                  {/* Zoom Controls */}
                  <div className="absolute bottom-2 right-2 flex gap-2 bg-white/80 p-2 rounded shadow-md z-10">
                    <button
                      onClick={()=>zoomIn()}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <MagnifyingGlassPlusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={()=>zoomOut()}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <MagnifyingGlassMinusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={()=>resetTransform()}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={()=>centerView()}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  <TransformComponent>
                    <img
                      src={imageSrc}
                      alt="POD"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      className="max-w-full max-h-full object-contain select-none pointer-events-none"
                    />
                  </TransformComponent>
                </>
              )}

              {isImageLoaded && isImageError && (
                <div className="text-gray-500 italic">Failed to load image.</div>
              )}
            </div>
          )}
        </TransformWrapper>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-4 border-t border-gray-200">
          <button
            className={`flex items-center gap-2 px-4 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded`}
            disabled={isImageError}
            onClick={() => handleDownload(imageSrc)}
          >
            {  (
              <ArrowDownTrayIcon className="w-4 h-4" />
            )}
            Download
          </button>
          <button
            className="px-4 py-1 text-sm text-red-600 border border-red-600 hover:bg-red-600 hover:text-white rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
