/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios"; 
import jpeg from "jpeg-js";
import fs, { stat } from "fs";
import path from "path";
import { Stream } from "stream";
import * as pure from "pureimage";
import { LoggerInterface } from "./Logger";

export interface ImageResult {
    imageType: string;
    imageData: jpeg.BufferRet | null;
}

interface AxiosResponse {
    data: Stream;
    status: number;
    statusText: string;
}

export class WebImageImage {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    // This optimized fillRect was derived from the pureimage source code: https://github.com/joshmarinacci/node-pureimage/tree/master/src
    // To fill a 1920x1080 image on a core i5, this saves about 1.5 seconds
    // img        - image - it has 3 properties height, width and data
    // x, y       - position of the rect
    // w, h       - size of the rect
    // rgb        - must be a string in this form "#112233"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private myFillRect(img: any, x: number, y: number, w: number, h: number, rgb: string) {
        const colorValue = parseInt(rgb.substring(1), 16);

        // the shift operator forces js to perform the internal ToUint32 (see ecmascript spec 9.6)
        //colorValue = colorValue >>> 0;
        const r = (colorValue >>> 16) & 0xFF;
        const g = (colorValue >>> 8)  & 0xFF;  
        const b = (colorValue)        & 0xFF;
        const a = 0xFF;

        for(let i = y; i < y + h; i++) {                
            for(let j = x; j < x + w; j++) {   
                const index = (i * img.width + j) * 4;   
                
                img.data[index + 0] = r;
                img.data[index + 1] = g;     
                img.data[index + 2] = b;     
                img.data[index + 3] = a; 
            }
        }
    }

    public async getImage(url: string) : Promise<ImageResult | null> {
        
        const imageHeight              = 1080; 
        const imageWidth               = 1920; 

        const backgroundColor          = "#000000";

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext("2d");

        // Fill the background
        ctx.fillStyle = backgroundColor;
        //ctx.fillRect(0, 0, imageWidth, imageHeight);
        this.myFillRect(img, 0, 0, imageWidth, imageHeight, backgroundColor);

        try {
            let picture: jpeg.BufferRet | null = null;

            if (url !== undefined) {
                
                // this.logger.verbose(`ApodImage: hdurl: ${pictureUrl}`);
                
                // first try to download a jpg
                try {
                    const response: AxiosResponse = await axios.get(url, {responseType: "stream"} );
                    picture = await pure.decodeJPEGFromStream(response.data);
                } catch (e) {
                    picture = null;
                }
            }

            if (picture !== null) {
                let scaledWidth = 0;
                let scaledHeight = 0;
                let pictureX = 0;
                let pictureY = 0;
                if (picture.width/picture.height > imageWidth/imageHeight) {
                    // Aspect ratio is wider than the full image aspect ratio, shorten the image
                    scaledWidth = imageWidth;
                    scaledHeight = (imageWidth * picture.height) / picture.width;
                    pictureX = 0;
                    pictureY = (imageHeight - scaledHeight) / 2;

                } else {
                    // Aspect ratio is narrower than the full image aspect ration, squeeze the image width
                    scaledHeight = imageHeight;
                    scaledWidth = (imageHeight * picture.width) / picture.height;
                    pictureX = (imageWidth - scaledWidth) / 2;    // Center the picture 
                    pictureY = 0; 
                }

                ctx.drawImage(picture,
                    0, 0, picture.width, picture.height,             // source dimensions
                    pictureX, pictureY, scaledWidth, scaledHeight    // destination dimensions
                );
            } else {
                return null;
            }
        } catch (e) {
            this.logger.warn(`NewsImage: Exception: ${e}, Picture: ${url as string}`);
            return null;
        }

        const jpegImg = jpeg.encode(img, 80);
        
        return {
            imageData: jpegImg,
            imageType: "jpg"
        };
    }
}
