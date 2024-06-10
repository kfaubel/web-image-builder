/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as pure from "pureimage";
import { LoggerInterface } from "./Logger";
import JPG from "jpeg-js";
import crypto from "crypto";

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
     * @param url - URL of the image
     * @param username - If needed for digest authentication
     * @param password - If needed for digest authentication
     * @returns MyImageType (height, width, data) of null
     */
    private async getPicture(url: string, username?: string, password?: string): Promise<MyImageType | null> {
        let picture: MyImageType | null = null;
        let pictureBuffer: Buffer | null = null;

        this.logger.info(`WebImageImage::getPicture: url: ${url} with: ${username ?? "No username"}`);

        const options: AxiosRequestConfig = {
            responseType: "arraybuffer",
            headers: {
                "Content-Encoding": "gzip"
            },
            timeout: 30000
        };

        // url:  http://domain.com:20180/cgi-bin/snapshot.cgi
        // base: http://domain.com:20180
        // uri:  /cgi-bin/snapshot.cgi
        const fullUrl = new URL(url);
        const base = `${fullUrl.protocol}//${fullUrl.host}`;
        const uri = url.replace(base, "");
        
        const startTime = new Date();
        await axios.get(url, options)
            .then(async (res: AxiosResponse) => {
                if (typeof process.env.TRACK_GET_TIMES !== "undefined") {
                    this.logger.info(`WebImageImage: GET TIME: ${new Date().getTime() - startTime.getTime()}ms`);
                }
                pictureBuffer = Buffer.from(res.data, "binary");
                this.logger.verbose(`WebImageImage::getPicture: Loaded ${url} with ${pictureBuffer.length} bytes`);
            })
            .catch(async (err: any) => {
                if (err.response?.status === 401) {
                    // The following digest retry was based on a post by vkarpov15 Valeri Karpov here: https://github.com/axios/axios/issues/686
                    // I had to merge some code from a previous Java implementation I worked on a few years ago.
                    // In particular: 
                    //   * changed split from ", " to ",".  I don't have a resource with spaces to make sure trim is added in all the right places.
                    //   * include 'opaque' in the response
                    //   * minor changes for typescript

                    if (typeof username === "undefined" || typeof password === "undefined") {
                        this.logger.info("WebGetImage::getPicture: Got 401 but we don't have a username and password.");
                        return null;
                    }

                    this.logger.verbose(`WebGetImage::getPicture: server wants authentication, using digest`);

                    let authRequest = err.response.headers["www-authenticate"];
                    authRequest = authRequest.replace("Digest", "").trim();
                    const authDetails = authRequest.split(",").map((v: string) => v.split("="));

                    const nonceCount = "00000001";
                    const cnonce = crypto.randomBytes(24).toString("hex");

                    // Assume the auth details are in order: realm, qop, nonce and opaque
                    const realm  = authDetails[0][1].replace(/"/g, "");
                    const nonce  = authDetails[2][1].replace(/"/g, "");
                    const opaque = authDetails[3][1].replace(/"/g, "");

                    const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

                    const HA1 = md5(`${username}:${realm}:${password}`);
                    const HA2 = md5(`GET:${uri}`);
                    const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);

                    options.headers = options.headers ?? {};

                    options.headers.authorization = `Digest username="${username}",realm="${realm}",nonce="${nonce}",` +
                                                    `uri="${uri}",qop="auth",opaque="${opaque}",algorithm="MD5",` +
                                                    `response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;
                    
                    const startTime = new Date();
                    await axios.get(url, options)
                        .then(async (res: AxiosResponse) => {
                            if (typeof process.env.TRACK_GET_TIMES !== "undefined") {
                                this.logger.info(`WebImageImage: GET TIME: ${new Date().getTime() - startTime.getTime()}ms`);
                            }
                            pictureBuffer = Buffer.from(res.data, "binary");
                        })
                        .catch((error: any) => {
                            this.logger.warn(`WebImageImage::getPicture: Failed to load ${url} with digest auth: ${error}`);
                        });
                } else {
                    this.logger.warn(`WebImageImage::getPicture: Failed to load ${url} (not 401): ${err}`);
                }
            });
            

        if (pictureBuffer === null) {
            return null;
        }

        picture = JPG.decode(pictureBuffer, { maxMemoryUsageInMB: 800 });

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
        const g = (colorValue >>> 8) & 0xFF;
        const b = (colorValue) & 0xFF;
        const a = 0xFF;

        for (let i = y; i < y + h; i++) {
            for (let j = x; j < x + w; j++) {
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
    public async getImage(url: string, username ?: string, password ?: string) : Promise < JPG.BufferRet | null > {
        if(url === undefined) {
            return null;
        }

        try {
            const imageHeight = 1080;
            const imageWidth = 1920;
            const backgroundColor = "#000000";

            const img = pure.make(imageWidth, imageHeight);
            const ctx = img.getContext("2d");

            // Fill the background
            this.myFillRect(img, 0, 0, imageWidth, imageHeight, backgroundColor);

            const image: MyImageType | null = await this.getPicture(url, username, password);

            if (image === null) {
                return null;
            }

            let scaledWidth = 0;
            let scaledHeight = 0;
            let pictureX = 0;
            let pictureY = 0;

            if (image.width / image.height > imageWidth / imageHeight) {
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
            this.logger.warn(`WebImageImage::getImage Exception: ${e}, Picture: ${url as string}\n ${e.stack}`);
            return null;
        } 
    }
}
