const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const path = require('path');

const app = express();

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

const port = process.env.PORT || 3005;

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//add authenciate Client
'use strict';

const async = require('async');
const { Console } = require('console');
const fs = require('fs');
const https = require('https');
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
var ocrjsondata =[];

/**
 * AUTHENTICATE
 * This single client is used for all examples.
 */
const key = process.env['COMPUTER_VISION_SUBSCRIPTION_KEY'];
const endpoint = process.env['COMPUTER_VISION_ENDPOINT']
if (!key) { throw new Error('Set your environment variables for your subscription key in COMPUTER_VISION_SUBSCRIPTION_KEY and endpoint in COMPUTER_VISION_ENDPOINT.'); }
// </snippet_vars>

// <snippet_client>
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);
// </snippet_client>
/**
 * END - Authenticate
 */


app.get('/', (req, res) => {
    res.send('Hello World!')
  });
app.get('/',(req,res)=>res.send("OCRtoJsonDataProcess"));
app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);
app.get('/health', async (req, res) => {
    res.send({
        status: true,
        // message: 'File is uploaded',
    });
})
//app.get('/login/github',(req,res) => {});
//app.get('/login/github/callback',(req,res) => {});

// <snippet_functiondef_begin>
function computerVision(filepath) {
   
    async.series([
      async function () {    

      /**
        *READ API
        *
        * This example recognizes both handwritten and printed text, and can handle image files (.jpg/.png/.bmp) and multi-page files (.pdf and .tiff)
        * Please see REST API reference for more information:
        * Read: https://westcentralus.dev.cognitive.microsoft.com/docs/services/computer-vision-v3-ga/operations/5d986960601faab4bf452005
        * Get Result Result: https://westcentralus.dev.cognitive.microsoft.com/docs/services/computer-vision-v3-ga/operations/5d9869604be85dee480c8750
        * 
        */

      // Status strings returned from Read API. NOTE: CASING IS SIGNIFICANT.
      // Before Read 3.0, these are "Succeeded" and "Failed"
      const STATUS_SUCCEEDED = "succeeded"; 
      const STATUS_FAILED = "failed"
      
      
      console.log('-------------------------------------------------');
      console.log('READ PRINTED, HANDWRITTEN TEXT AND PDF');
      console.log();

      const ImageLocalPath = filepath;
      console.log('\nRead handwritten text from local file...', ImageLocalPath);
      const writingResult = await readTextFromFile(computerVisionClient, ImageLocalPath);
      printRecText(writingResult);

      console.log("completed");
      console.log(ocrjsondata);

      async function readTextFromFile(client, localImagePath) {
        // To recognize text in a local image, replace client.read() with readTextInStream() as shown:
        let result = await client.readInStream(() => createReadStream(localImagePath));
        // Operation ID is last path segment of operationLocation (a URL)
        let operation = result.operationLocation.split('/').slice(-1)[0];

        // Wait for read recognition to complete
        // result.status is initially undefined, since it's the result of read
        while (result.status !== STATUS_SUCCEEDED) { await sleep(1000); result = await client.getReadResult(operation); }
        return result.analyzeResult.readResults; // Return the first page of result. Replace [0] with the desired page if this is a multi-page file such as .pdf or .tiff.
      }
      // </snippet_read_helper>

      // <snippet_read_print>
      // Prints all text from Read result
      
      function printRecText(readResults) {
          console.log('Recognized text:');
        for (const page in readResults) {
          if (readResults.length > 1) {
            console.log(`==== Page: ${page}`)
            ocrjsondata.push(`==== Page: ${page}`);
          }
          const result = readResults[page];
          if (result.lines.length) {
            for (const line of result.lines) {
              console.log(line.words.map(w => w.text).join(' '));
              ocrjsondata.push(line.text);
            }
          }
          else { console.log('No recognized text.');
                ocrjsondata.push('No recognized text.') 
          }
        }      //console.log(data1);
      }     
 },
        function () {
          return  new Promise((resolve) => {
            resolve();
          })
        }
  ], (err) => {
  throw (err);
  });
}

app.post('/ocrfiles', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {            
            let ocrfile = req.files.ocrfile;

            //Use the mv() method to place the file in upload directory (i.e. "uploads")            
            await ocrfile.mv('./ocrfiles/' + ocrfile.name);
            const ocrpath =  __dirname + '\\ocrfiles\\'+ocrfile.name;
            console.log(ocrpath);
             await computerVision(ocrpath); 
             //console.log(ocrjsondata);   
                      await sleep(20000);
          
                       res.send({
                        status: true,
                        message: 'File is uploaded',
                        data: {
                            name: ocrfile.name,
                            mimetype: ocrfile.mimetype,
                            size: ocrfile.size,
                                                       
                        },
                        ocrdata: ocrjsondata,                       
                        
                    });   
                    ocrjsondata =[];                      
        }
    } 
    catch (err) {
        res.status(500).send(err);
    }
});
module.exports = app;