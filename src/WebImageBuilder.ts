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

    public async CreateImages(url: string, fileName: string, username?: string, password?: string): Promise<boolean>{
        try {
            const webImageImage: WebImageImage = new WebImageImage(this.logger);

            const result = await webImageImage.getImage(url, username, password);
        
            if (result !== null && result !== null ) {
                this.logger.info(`WebImageBuilder: Writing: ${fileName}`);
                this.writer.saveFile(fileName, result.data);
            } else {
                this.logger.warn(`WebImageBuilder: No image available for: ${fileName}`);
                return false;
            }
            
        } catch (e) {
            this.logger.error(`WebImageBuilder: Exception getting ${fileName}: ${e}`);
            return false;
        }

        return true;
    }
}
