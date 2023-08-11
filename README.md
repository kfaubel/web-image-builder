# web-image-builder
Simple nodeJS module that GETs an image and saves it.  Copy avoids CORS restrictions for pages that want to include this image.

test.ts shows how to use the module

The normal use of this module is to build an npm module that can be used as part of a bigger progress.

index.d.ts describes the interface for the module

The LoggerInterface, KacheInterface and ImageWriterInterface interfaces are dependency injected into the module.  Simple versions are provided and used by the test wrapper.

Once instanciated, the CreateImages() method can be called to create today's current chart.

To use the test wrapper to build a screen, run the following command.  
```
$ npm start

or

$ node app.js 
```
