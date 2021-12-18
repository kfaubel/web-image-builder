/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { WebImageImage } from "./WebImageImage";

export class WebImageBuilder {
    private logger: LoggerInterface;
    private cache: KacheInterface | null; 
    private writer: ImageWriterInterface;

    constructor(logger: LoggerInterface, cache: KacheInterface | null, writer: ImageWriterInterface) {
        this.logger = logger;
        this.cache = cache; 
        this.writer = writer;
    }

    public async CreateImages(url: string, fileName: string): Promise<boolean>{
        try {
            const webImageImage: WebImageImage = new WebImageImage(this.logger);

            const result = await webImageImage.getImage(url);
        
            if (result !== null && result.imageData !== null ) {
                this.logger.info(`CreateImages: Writing: ${fileName}`);
                this.writer.saveFile(fileName, result.imageData.data);
            } else {
                this.logger.error("CreateImages: No imageData returned from webImageImage.getImage");
                return false;
            }
            
        } catch (e) {
            this.logger.error(`CreateImages: Exception: ${e}`);
            return false;
        }

        return true;
    }
}
