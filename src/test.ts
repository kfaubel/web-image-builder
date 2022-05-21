import dotenv from "dotenv";
import { Kache } from "./Kache";
import { Logger } from "./Logger";
import { SimpleImageWriter } from "./SimpleImageWriter";
import { WebImageBuilder } from "./WebImageBuilder";

interface WebImageItem {
    url: string;
    fileName: string;
    fetchIntervalMin: number
    username?: string;
    password?: string;
}

async function run() {
    dotenv.config();  // Load var from .env into the environment

    const logger: Logger = new Logger("WebImage", "verbose");
    const cache: Kache = new Kache(logger, "web-image.json"); 
    const simpleImageWriter: SimpleImageWriter = new SimpleImageWriter(logger, "images");
    const webImageBuilder: WebImageBuilder = new WebImageBuilder(logger, cache, simpleImageWriter);

    let webImageList: Array<WebImageItem>;
    const WEB_IMAGES: string | undefined = process.env.WEB_IMAGES;
    if (WEB_IMAGES === undefined) {
        logger.error("Missing config: WEB_IMAGES");
        throw new Error("Missing config");
    } else {
        webImageList = JSON.parse(WEB_IMAGES);
    }

    logger.info(`WEB_IMAGES: ${JSON.stringify(webImageList, null, 4)}`);

    let success = true;
    for (const webImageItem of webImageList) {
        success = success && await webImageBuilder.CreateImages(webImageItem.url, webImageItem.fileName, webImageItem.fetchIntervalMin, webImageItem.username, webImageItem.password);
    }

    logger.info(`test.ts: Done: ${success ? "successfully" : "failed"}`); 

    return success ? 0 : 1;
}

run();