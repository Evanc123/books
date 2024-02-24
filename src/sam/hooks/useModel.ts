import { InferenceSession, Tensor } from "onnxruntime-web";
import { modelScaleProps } from "../components/helpers/Interfaces";

/* @ts-ignore */
import React, { useContext, useEffect, useState } from "react";
import { modelScaleProps } from "./components/helpers/Interfaces";
import Resizer from "react-image-file-resizer";

import { onnxMaskToImage } from "./components/helpers/maskUtils";
const hull = require("hull.js");
const simplify = require("simplify-js");

const ort = require("onnxruntime-web");
/* @ts-ignore */
import npyjs from "npyjs";
import { modelData } from "../components/helpers/onnxModelAPI";

type Point = [number, number];
type Polygon = Point[];

export function arrToPoints(
  floatArray: any,
  width: number,
  height: number,
  threshold = 0.5,
): Polygon {
  let points: Polygon = [];
  for (let i = 0; i < floatArray.length; i++) {
    const row = i % height;
    const col = Math.floor(i / height);
    if (floatArray[i] > threshold) {
      points.push([row, col]);
    }
  }
  return points;
}

export function float32ArrayToBinaryMask(
  floatArray: any,
  width: number,
  height: number,
  threshold = 0.5,
): number[][] {
  const binaryMask: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0),
  );

  for (let i = 0; i < floatArray.length; i++) {
    const row = i % height;
    const col = Math.floor(i / height);

    binaryMask[row][col] = floatArray[i] > threshold ? 1 : 0;
  }

  return binaryMask;
}
export function findBoundingRectangle(
  mask: number[][],
): [number, number, number, number] {
  const height = mask.length;
  const width = mask[0].length;

  let xMin = width;
  let xMax = 0;
  let yMin = height;
  let yMax = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (mask[row][col] === 1) {
        xMin = Math.min(xMin, col);
        xMax = Math.max(xMax, col);
        yMin = Math.min(yMin, row);
        yMax = Math.max(yMax, row);
      }
    }
  }
  // console.log(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1);

  return [xMin, yMin, xMax - xMin + 1, yMax - yMin + 1];
}
export function cropImage(
  originalImage: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  binaryMask: any,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = height; //TODO: !!
  canvas.height = width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // note taht all of that x and y is flipped because of height order
  ctx.drawImage(originalImage, y, x, height, width, 0, 0, height, width);

  const croppedImageData = ctx.getImageData(0, 0, height, width);
  const croppedData = croppedImageData.data;

  // Iterate through the cropped image and apply the binary mask
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (binaryMask[y + j] && binaryMask[y + j][x + i] === 0) {
        const index = (i * height + j) * 4;
        croppedData[index] = 0;
        croppedData[index + 1] = 0;
        croppedData[index + 2] = 0;
        croppedData[index + 3] = 255;
      }
    }
  }
  // convexHull(binaryMask);

  // Put the modified ImageData back on the canvas
  ctx.putImageData(croppedImageData, 0, 0);
  return canvas;
}
export function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const file = new File([blob], fileName, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
}
export const rotateImageDueToWidth = (file: any) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      600,
      600,
      "PNG",
      100,
      270,
      (uri) => {
        resolve(uri);
      },
      "file",
    );
  });

// Define image, embedding and model paths
const MODEL_DIR = "/model/sam_onnx_quantized_example.onnx";

export interface modelInputProps {
  x: number;
  y: number;
  clickType: number;
}

// Helper function for handling image scaling needed for SAM
const handleImageScale = (w: number, h: number) => {
  // Input images to SAM must be resized so the longest side is 1024
  const LONG_SIDE_LENGTH = 1024;
  const samScale = LONG_SIDE_LENGTH / Math.max(h, w);
  return samScale;
};

interface IUseModelProps {
  w: number;
  h: number;
  imageEmbeddingUrl: string | null;
  persistMask: (imageFile: File, polygon: any) => string | undefined;
}

export const useModel = ({
  w,
  h,
  imageEmbeddingUrl,
  persistMask,
}: IUseModelProps) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null); // Image embedding tensor
  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  useEffect(() => {
    console.log(w, h);
    if (!imageEmbeddingUrl || w === 0 || h === 0) {
      return;
    }
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const model = await InferenceSession.create(URL);
        setModel(model);
        setIsModelLoaded(true); // need to check for tensor loading as well
      } catch (e) {
        console.log(e);
      }
    };
    initModel();

    const samScale = handleImageScale(w, h);
    setModelScale({
      height: h, // original image height
      width: w, // original image width
      samScale: samScale, // scaling factor for image which has been resized to longest side 1024
    });

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(imageEmbeddingUrl, "float32")).then(
      (embedding) => setTensor(embedding),
    );
  }, [w, h, imageEmbeddingUrl]);

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  const sendClickToModel = async (
    click: modelInputProps,
    image: HTMLImageElement,
  ) => {
    //  If the click is on an existing mask in masks,
    //  1. Remove the mask from the list
    //  2. Exit

    //  Else:
    //  1. Run ONNX on the click
    //  2. Add the new Mask
    try {
      if (
        model === null ||
        click === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // in the future, sam can take multiple clicks
        const clicks = [click];
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        const width = output.dims[2];
        const height = output.dims[3];
        // Usage example
        const floatArray = output.data; // new Float32Array(/* Your Float32Array data */);

        const binaryMask = float32ArrayToBinaryMask(floatArray, width, height);
        const points = arrToPoints(floatArray, width, height);
        const convexHull = hull(points, 80); // Adjust the second parameter (concavity) as needed
        const pointsToSimplify = convexHull.map((point: any[]) => {
          return { x: point[0], y: point[1] };
        });
        const simplifiedPolygonMask = simplify(pointsToSimplify, 1); // Adjust the second parameter (tolerance) as needed

        const boundingRectangle = findBoundingRectangle(binaryMask);
        const [x, y, cropWidth, cropHeight] = boundingRectangle;
        const croppedMaskImageElement = cropImage(
          image,
          x,
          y,
          cropWidth,
          cropHeight,
          binaryMask,
        );

        const croppedImage = await canvasToFile(
          croppedMaskImageElement,
          "cropped_image.png",
        );
        let imageFile = croppedImage;
        if (cropWidth > cropHeight) {
          imageFile = (await rotateImageDueToWidth(croppedImage)) as File;
        }
        return persistMask(imageFile, simplifiedPolygonMask);
      }
    } catch (e) {
      console.log(e);
      return "";
    }
  };
  return { isModelLoaded, sendClickToModel };
};
