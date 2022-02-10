/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as pure from "pureimage";
import { LoggerInterface } from "./Logger";
import JPG from "jpeg-js";

export interface MyImageType {
    width: number;
    height: number;
    data: Buffer;
}

export class WebImageImage {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    /**
     * Simple method to fetch the image given a URL
     * @param url 
     * @returns MyImageType (height, width, data) of null
     */
    private async getPicture(url: string) : Promise<MyImageType | null> {
        let picture: MyImageType | null = null;
        let pictureBuffer: Buffer | null = null;

        const options: AxiosRequestConfig = {
            responseType: "arraybuffer",
            headers: {                        
                "Content-Encoding": "gzip"
            },
            timeout: 20000
        };

        const startTime = new Date();
        await axios.get(url, options)
            .then(async (res: AxiosResponse) => {
                if (typeof process.env.TRACK_GET_TIMES !== "undefined" ) {
                    this.logger.info(`WebImageImage: GET TIME: ${new Date().getTime() - startTime.getTime()}ms`);
                }
                pictureBuffer = Buffer.from(res.data, "binary");
            })
            .catch((error) => {
                this.logger.warn(`WebImageImage: Failed to load ${url}: ${error}`);
            });

        if (pictureBuffer === null) {
            return null;
        }

        picture = JPG.decode(pictureBuffer, {maxMemoryUsageInMB: 800});

        //const bitmap = pure.make(picture.width, picture.height);
        //bitmap.data = picture.data;

        return picture;
    }

    /**
     * Optimized fill routine for pureimage
     * - See https://github.com/joshmarinacci/node-pureimage/tree/master/src
     * - To fill a 1920x1080 image on a core i5, this saves about 1.5 seconds
     * @param img it has 3 properties height, width and data
     * @param x X position of the rect
     * @param y Y position of the rect
     * @param w Width of rect
     * @param h Height of rect
     * @param rgb Fill color in "#112233" format
     */
    private myFillRect(img: any, x: number, y: number, w: number, h: number, rgb: string) {
        const colorValue = parseInt(rgb.substring(1), 16);

        // The shift operator forces js to perform the internal ToUint32 (see ecmascript spec 9.6)
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

    /**
     * Method to GET an image and insert it into a 1920x1080 image
     * @param url Path to the embedded image
     * @returns An encoded JPG image
     */
    public async getImage(url: string) : Promise<JPG.BufferRet | null> {
        if (url === undefined) {
            return null;
        }

        try {
            const imageHeight              = 1080; 
            const imageWidth               = 1920; 
            const backgroundColor          = "#000000";

            const img = pure.make(imageWidth, imageHeight);
            const ctx = img.getContext("2d");

            // Fill the background
            this.myFillRect(img, 0, 0, imageWidth, imageHeight, backgroundColor);

            const image: MyImageType | null = await this.getPicture(url);

            if (image === null) {
                return null;
            }

            let scaledWidth = 0;
            let scaledHeight = 0;
            let pictureX = 0;
            let pictureY = 0;

            if (image.width/image.height > imageWidth/imageHeight) {
                // Aspect ratio is wider than the full image aspect ratio, shorten the image
                scaledWidth = imageWidth;
                scaledHeight = (imageWidth * image.height) / image.width;
                pictureX = 0;
                pictureY = (imageHeight - scaledHeight) / 2;

            } else {
                // Aspect ratio is narrower than the full image aspect ration, squeeze the image width
                scaledHeight = imageHeight;
                scaledWidth = (imageHeight * image.width) / image.height;
                pictureX = (imageWidth - scaledWidth) / 2;    // Center the picture 
                pictureY = 0; 
            }

            const bitmap = pure.make(image.width, image.height);
            bitmap.data = image.data;

            ctx.drawImage(bitmap,
                0, 0, image.width, image.height,             // source dimensions
                pictureX, pictureY, scaledWidth, scaledHeight    // destination dimensions
            );

            const jpegImg = JPG.encode(img, 80);
        
            return jpegImg;
            
        } catch (e: any) {
            this.logger.warn(`WebImageImage: Exception: ${e}, Picture: ${url as string}\n ${e.stack}`);
            return null;
        } 
    }
}
