import * as fs from "fs";
import path from "path";
import { LoggerInterface } from "./Logger";

export interface ImageWriterInterface {
    saveFile(fileName: string, dataBuffer: Buffer, contentType?: string): Promise<boolean>
    deleteFile(fileName: string): Promise<boolean>;
    checkFile(fileName: string): Promise<boolean>;
}

export class SimpleImageWriter implements ImageWriterInterface {
    private logger: LoggerInterface;
    private directory: string;

    constructor(logger: LoggerInterface, directory: string) {
        this.logger = logger;
        this.directory = directory;

        try {
            fs.mkdirSync(this.directory, { recursive: true });
        } catch (e) {
            this.logger.error(`Failure to create output directory ${this.directory} - ${e}`);
        }
    }

    /**
     * saveFile
     * @param fileName 
     * @param buf 
     */
    public saveFile = async (fileName: string, buf: Buffer): Promise<boolean> => {
        const fullName: string = path.join(this.directory, fileName);
        fs.writeFileSync(fullName, buf);
        return true;
    };

    /**
     * deleteFile
     * @param fileName 
     */
    public deleteFile = async (fileName: string): Promise<boolean> => {
        const fullName: string = path.join(this.directory, fileName);
        try {
            fs.unlinkSync(fullName);
        } catch(e) {
            return false;
        }
        return true;
    };

    /**
     * checkFile
     * @param fileName 
     * @returns true if the file exists, false otherwise
     */
    public checkFile = async (fileName: string): Promise<boolean> => {
        const fullName: string = path.join(this.directory, fileName);
        return fs.existsSync(fullName);
    };
}