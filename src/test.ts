/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from "dotenv";
import { Logger } from "./Logger";
import { SimpleImageWriter } from "./SimpleImageWriter";
import { WebImageBuilder } from "./WebImageBuilder";

async function run() {
    dotenv.config();  // Load var from .env into the environment

    const logger: Logger = new Logger("WebImage", "verbose");
    //const cache: Kache = new Kache(logger, "apod-cache.json"); 
    const simpleImageWriter: SimpleImageWriter = new SimpleImageWriter(logger, "images");
    const webImageBuilder: WebImageBuilder = new WebImageBuilder(logger, null, simpleImageWriter);

    const url = "https://www.weather.gov/images/box/winter/StormTotalSnow.jpg";
    const fileName = "boxStormTotalSnow.jpg";
   
    const success: boolean = await webImageBuilder.CreateImages(url, fileName);

    logger.info(`test.ts: Done: ${success ? "successfully" : "failed"}`); 

    return success ? 0 : 1;
}

run();