/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { WebImageImage } from "./WebImageImage";
import * as crypto from "crypto"; // Import the crypto module

interface CacheValue {
    md5: string,
    savedDate: number,
    validUntilDate: number  // Date in seconds when the image is no longer valid (snowtotals are only good for 48 hours)
}

export class WebImageBuilder {
    private logger: LoggerInterface;
    private cache: KacheInterface; 
    private writer: ImageWriterInterface;

    constructor(logger: LoggerInterface, cache: KacheInterface, writer: ImageWriterInterface) {
        this.logger = logger;
        this.cache = cache; 
        this.writer = writer;
    }

    /**
     * CreateImages
     *   Cache expiration time - Here we will use 1 year.  We need to keep the cache item for a long time.  This will be 1 year
     *   savedDate - When the image was saved.  We will use this to tell if its time to refresh the image.  This might be 30 minutes to 6 hours.
     *   validUntilDate - When the image is no longer valid/useful.  This might be 24-48 hours.
     * @param url 
     * @param fileName 
     * @param fetchIntervalMin - How long into the future is the "cache" entry valid (for snowtotals, this could be a year)
     * @param validMin - How many minutes after the "image" was fetched is it good for
     * @param username - If needed for digest authentication
     * @param password - If needed for digest authentication
     * @returns 
     */
    public async CreateImage(url: string, fileName: string, fetchIntervalMin: number, validMin: number, username?: string, password?: string): Promise<boolean>{
        try {
            const webImageImage: WebImageImage = new WebImageImage(this.logger);

            const cachedValue: CacheValue = this.cache.get(fileName) as CacheValue;

            // Return right away if the saved image date was within the fetch interval
            if (cachedValue !== null) {
                this.logger.verbose(`WebImageBuilder: Found cached value for: ${fileName} valid until: ${new Date(cachedValue.validUntilDate).toLocaleString()}`);
                
                if (cachedValue.savedDate + fetchIntervalMin * 60 * 1000 > new Date().getTime()) {
                    this.logger.verbose(`WebImageBuilder: Cached value is still valid for: ${fileName}`);
                    return true;
                }
            }

            const result = await webImageImage.getImage(url, username, password);
            if (result === null) {
                this.logger.warn(`WebImageBuilder: No image available for: ${fileName}`);
                return false;
            }

            // generate an md5 hash of the image data
            const hash = crypto.createHash("md5");
            hash.update(result.data);
            const md5 = hash.digest("hex");

            const newCacheValue = {
                md5: md5,
                savedDate: new Date().getTime(),
                validUntilDate: new Date(new Date().getTime() + validMin * 60 * 1000).getTime()
            };

            if (cachedValue === null || cachedValue === undefined) {
                // We have not seen this before or the cache value has expired and we should start again.
                // The cache should rarely expire because any change to the image writes a new cache entry
                this.logger.info(`WebImageBuilder: No previous cached value, Writing: ${fileName} and saving cache`);
                this.writer.saveFile(fileName, result.data);
                this.logger.verbose(`WebImageBuilder: Saving new cache value for: ${fileName} valid until: ${new Date(newCacheValue.validUntilDate).toLocaleString()}`);
                this.cache.set(fileName, newCacheValue, new Date().getTime() + validMin * 60 * 1000);
                return true;
            }

            if (cachedValue.md5 !== md5) {
                // We have a new image, dave it and update the cache
                this.logger.info(`WebImageBuilder: New image retreived, Writing: ${fileName} and saving cache`);
                this.writer.saveFile(fileName, result.data);
                this.cache.set(fileName, newCacheValue, new Date().getTime() + fetchIntervalMin * 60 * 1000);
                return true;
            }

            // The image is the same, but is it still valid.  This is typically 24-48 hours after the image last changed.
            if (cachedValue.validUntilDate < new Date().getTime()) {
                // The cached image is present, but the image itself has is no longer valid
                // We also know that the image is the same as the cached image
                this.logger.info(`WebImageBuilder: Cached image is no longer valid and ne new image is available, deleting: ${fileName}`);
                this.writer.deleteFile(fileName);
                return true;
            }

        } catch (e: any) {
            this.logger.error(`WebImageBuilder: Exception getting ${fileName}: ${e.stack}`);
            return false;
        }

        return true;
    }
}
