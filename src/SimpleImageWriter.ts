import * as fs from "fs";
import path from "path";
import { LoggerInterface } from "./Logger";

export interface ImageWriterInterface {
    saveFile(fileName: string, buf: Buffer): void;
    deleteFile(fileName: string): void;
    checkFile(fileName: string): boolean;
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
    public saveFile = (fileName: string, buf: Buffer): void => {
        const fullName: string = path.join(this.directory, fileName);
        fs.writeFileSync(fullName, buf);
    };

    /**
     * deleteFile
     * @param fileName 
     */
    public deleteFile = (fileName: string): void => {
        const fullName: string = path.join(this.directory, fileName);
        fs.unlinkSync(fullName);   
    };  
    
    /**
     * checkFile
     * @param fileName 
     * @returns true if the file exists, false otherwise
     */
    public checkFile = (fileName: string): boolean => {
        const fullName: string = path.join(this.directory, fileName);
        return fs.existsSync(fullName);
    };
}