/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { WebImageImage } from "./WebImageImage";

export class WebImageBuilder {
    private logger: LoggerInterface;
    private cache: KacheInterface; 
    private writer: ImageWriterInterface;

    constructor(logger: LoggerInterface, cache: KacheInterface, writer: ImageWriterInterface) {
        this.logger = logger;
        this.cache = cache; 
        this.writer = writer;
    }

    public async CreateImages(url: string, fileName: string, fetchIntervalMin: number, username?: string, password?: string): Promise<boolean>{
        try {
            // We don't really need the value, we just want to know if there is a current (not expired) cache item
            const lastUpdate: string = this.cache.get(fileName) as string;
            if (lastUpdate === null) {
                const webImageImage: WebImageImage = new WebImageImage(this.logger);

                const result = await webImageImage.getImage(url, username, password);
            
                if (result !== null && result !== null ) {
                    this.logger.info(`WebImageBuilder: Writing: ${fileName}`);
                    this.writer.saveFile(fileName, result.data);

                    this.cache.set(fileName, Date.now().toString, new Date().getTime() + fetchIntervalMin * 60 * 1000);
                } else {
                    this.logger.warn(`WebImageBuilder: No image available for: ${fileName}`);
                    return false;
                }
            } else {
                this.logger.info(`WebImageBuilder: Up to date: ${fileName}`);
            }
        } catch (e) {
            this.logger.error(`WebImageBuilder: Exception getting ${fileName}: ${e}`);
            return false;
        }

        return true;
    }
}
