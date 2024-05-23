# web-image-builder
Simple nodeJS module that GETs an image and saves it.  Copy avoids CORS restrictions for pages that want to include this image.

test.ts shows how to use the module

The normal use of this module is to build an npm module that can be used as part of a bigger progress.

index.d.ts describes the interface for the module

The LoggerInterface, KacheInterface and ImageWriterInterface interfaces are dependency injected into the module.  Simple versions are provided and used by the test wrapper.

To run stand alone, the test.ts wrapper is provided.  The environment variable WEB_IMAGES should be set to something like the following JSON, all on one line.
```
WEB_IMAGES="[ { \"url\":\"https://www.weather.gov/images/box/winter/StormTotalSnow.jpg\", \"fileName\":\"boxStormTotalSnow.jpg\", \"fetchIntervalMin\":\"120\", \"validMin\":\"2160\" }, ... ]"    
```
* url is the URL of the image to fetch
* fileName is the name of the file to save the image to
* fetchIntervalMin is the number of minutes between fetches
* validMin is the number of minutes the image is valid - if the source image has not changed in 2160 minutes (36 hours), keep track of it but delete the image in the target directory
* username is the username to use for basic authentication (optional)
* password is the password to use for basic authentication (optional)

```json
[
   {
      "url":"https://www.weather.gov/images/box/winter/StormTotalSnow.jpg",
      "fileName":"boxStormTotalSnow.jpg",
      "fetchIntervalMin":"120",
      "validMin":"2160"
   },
   ...
]
```
Once instanciated, the CreateImage() method can be called to create today's current chart.

To use the test wrapper to build a screen, run the following command.  
```
$ npm start

or

$ node app.js 
```
