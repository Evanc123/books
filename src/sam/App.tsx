"use client";
// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { InferenceSession, Tensor } from "onnxruntime-web";
import React, { useContext, useEffect, useState } from "react";
import { handleImageScale } from "./components/helpers/scaleHelper";
import { modelScaleProps } from "./components/helpers/Interfaces";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { modelData } from "./components/helpers/onnxModelAPI";
import Stage from "./components/Stage";
import AppContext from "./components/hooks/createContext";
const hull = require("hull.js");
const simplify = require("simplify-js");

const ort = require("onnxruntime-web");
/* @ts-ignore */
import npyjs from "npyjs";

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

// Define image, embedding and model paths
const IMAGE_PATH = "/mir.jpg";
const IMAGE_EMBEDDING = "/mir.npy";
const MODEL_DIR = "/model/sam_onnx_quantized_example.onnx";
const App = ({
  imageUrl,
  imageEmbeddingUrl,
}: {
  imageUrl: string;
  imageEmbeddingUrl: string;
}) => {
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
  } = useContext(AppContext)!;
  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null); // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const model = await InferenceSession.create(URL);
        setModel(model);
      } catch (e) {
        console.log(e);
      }
    };
    initModel();

    // Load the image
    const url = new URL(imageUrl, location.origin);
    loadImage(url);

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(imageEmbeddingUrl, "float32")).then(
      (embedding) => setTensor(embedding),
    );
    console.log("test");
  }, []);

  const loadImage = async (url: URL) => {
    try {
      const img = new Image();
      img.src = url.href;
      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width;
        img.height = height;
        setImage(img);
      };
    } catch (error) {
      console.log(error);
    }
  };

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // Preapre the model input in the correct format for SAM.
        // The modelData function is from onnxModelAPI.tsx.
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

        // The predicted mask returned from the ONNX model is an array which is
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(
          onnxMaskToImage(output.data, output.dims[2], output.dims[3]),
        );
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
        console.log(simplifiedPolygonMask, boundingRectangle);
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
      }
    } catch (e) {
      console.log(e);
    }
  };

  return <Stage />;
};

export default App;
