const request = require("supertest");
    const app = require("../OcrtoJsonData");

    describe("GET /", () => {
      it("respond with Hello World", (done) => {
        request(app).get("/").expect("OCRtoJsonDataProcess", done);
      })
    });