import { type modelInputProps } from "./helpers/Interfaces";
import React, { useEffect, useRef, useState } from "react";

interface IEditMaskedImage {
  sendClickToModel: (
    click: modelInputProps,
    image: HTMLImageElement,
  ) => Promise<string | undefined>;

  setNaturalImageWidth: (value: number) => void;
  setNaturalImageHeight: (value: number) => void;
  src: string;
  alt: string;

  polygons: Mask[] | null; // Array of polygon points
  selectedMask: Mask | null;

  setSelectedMaskId: (maskId: string | null) => void;
}

export const EditMaskedImage: React.FC<IEditMaskedImage> = ({
  sendClickToModel,
  setNaturalImageHeight,
  setNaturalImageWidth,
  src,
  alt,
  polygons,
  selectedMask,
  setSelectedMaskId,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const polygonRefs = useRef<(SVGPolygonElement | null)[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const polygonsToShow = polygons;
  useEffect(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  }, [imageRef]);

  useEffect(() => {
    if (imageRef.current) {
      // inefficient, but can't figure out where it shoudl be to
      // enable resize on first render
      const rect = imageRef.current.getBoundingClientRect();
      setWidth(rect.width);
      setHeight(rect.height);
    }
    if (imageDimensions && width && height && polygonsToShow) {
      // Calculate new points for each polygon

      const newPolygons = polygonsToShow.map((mask) => {
        const dbPolygons = JSON.parse(mask.polygons) as Array<any>;
        // const dbPolygons = mask?.mask_polygon as Array<any>;
        return dbPolygons?.map(({ x, y }) => ({
          x: (x / imageDimensions.width) * width,
          y: (y / imageDimensions.height) * height,
        }));
      });

      if (polygonRefs.current) {
        newPolygons.forEach((newPoints, index) => {
          if (polygonRefs.current?.[index]) {
            polygonRefs.current[index]?.setAttribute(
              "points",
              newPoints.map(({ x, y }) => `${x},${y}`).join(" "),
            );
          }
        });
      }
    }
  }, [imageDimensions, width, height, polygons, selectedMask, polygonsToShow]);

  const handleImageLoad = () => {
    if (imageRef.current && svgRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });

      setNaturalImageHeight(imageRef.current.naturalHeight);
      setNaturalImageWidth(imageRef.current.naturalWidth);
      const aspectRatio =
        imageRef.current.naturalWidth / imageRef.current.naturalHeight;
      const maxWidth = window.innerWidth * 1;
      const maxHeight = window.innerHeight * 1;
      let newWidth = maxWidth;
      let newHeight = newWidth / aspectRatio;

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
      }

      imageRef.current.style.width = `${newWidth}px`;
      imageRef.current.style.height = `${newHeight}px`;

      svgRef.current.style.width = `${newWidth}px`;
      svgRef.current.style.height = `${newHeight}px`;
      svgRef.current.style.position = "absolute";
      svgRef.current.style.top = imageRef.current.offsetTop + "px";
      svgRef.current.style.left = imageRef.current.offsetLeft + "px";
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setWidth(rect.width);
        setHeight(rect.height);
      }
      if (imageRef.current && svgRef.current) {
        const aspectRatio =
          imageRef.current.naturalWidth / imageRef.current.naturalHeight;
        const maxWidth = window.innerWidth * 1;
        const maxHeight = window.innerHeight * 1;
        let newWidth = maxWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }

        imageRef.current.style.width = `${newWidth}px`;
        imageRef.current.style.height = `${newHeight}px`;

        imageRef.current.style.width = `${newWidth}px`;
        imageRef.current.style.height = `${newHeight}px`;

        svgRef.current.style.width = `${newWidth}px`;
        svgRef.current.style.height = `${newHeight}px`;
        svgRef.current.style.position = "absolute";
        svgRef.current.style.top = imageRef.current.offsetTop + "px";
        svgRef.current.style.left = imageRef.current.offsetLeft + "px";
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call handleResize initially to ensure correct dimensions are calculated

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    console.log(`Clicked at (x: ${x}, y: ${y}) on the original image.`);
    async function sendToModel() {
      const newMaskId = await sendClickToModel(
        { x: x, y: y, clickType: 1 },
        img,
      );
    }
    void sendToModel();
  };

  return (
    <div className="">
      <img
        src={src}
        alt={alt}
        className="!h-full !w-full object-contain"
        ref={imageRef}
        onLoad={handleImageLoad}
        onClick={handleImageClick}
        crossOrigin="anonymous"
      />
      <svg
        ref={svgRef}
        className="pointer-events-none !h-full !w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="shimmer-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <animate
              attributeName="x1"
              from="-100%"
              to="200%"
              dur="8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              from="0%"
              to="300%"
              dur="8s"
              repeatCount="indefinite"
            />
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
          </linearGradient>
        </defs>
        {polygonsToShow?.map((mask, index) => {
          // const points = mask.mask_polygon as Array<any>;

          const points = JSON.parse(mask.polygons) as Array<any>;
          return (
            <polygon
              id={`mask-${mask.id}`}
              key={index}
              ref={(el) => (polygonRefs.current[index] = el)}
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="url(#shimmer-gradient)"
              stroke="blue"
              strokeWidth="2"
              // onClick={handlePolygonClick(mask.id, points)}
              pointerEvents="all"
              className={`cursor-pointer ${
                selectedMask?.id === mask?.id ? "opacity-100" : "opacity-0"
              }`} // Update this line
              onMouseEnter={() => setSelectedMaskId(mask.id)} // Add this line
              // onMouseLeave={() => setSelectedMaskId(null)}
            />
          );
        })}
      </svg>
    </div>
  );
};
