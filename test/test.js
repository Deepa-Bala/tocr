const request = require("supertest");
    const app = require("../index");

    describe("GET /", () => {
      it("respond with Hello World", (done) => {
      
        request(app).get("/")
                    .expect("OCRtoJsonDataProcess", done)
                    .end(function(err, res) {
                        if (err) return done(err);
                        done();
                       });
      })
    });