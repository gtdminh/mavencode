const mocha = require('mocha');
const Maven = require('../maven');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const vscode = {
  workspace: {
    rootPath: "./"
  },
  extensions: {
    getExtension: () => { return { extensionPath: fs.realpathSync(__dirname + "/../") } }
  }
}
const service = new Maven(vscode);

before(function () {
  const pom = service.maven.pom;
  if (fs.existsSync(pom))
    fs.unlinkSync(pom);
})


describe("Test Maven service ", function () {
  it("init pom", function (done) {
    service.init("fxrialab.mavencode", "");
    service.readJson().then(function (pomObj) {
      assert(pomObj, "pom not null")
      assert(pomObj.project.name[0] === "mavencode", "Incorrect project name");

      assert(pomObj.project.groupId[0] === "fxrialab", "Incorrect project name");
      assert(pomObj.project.artifactId[0] === "mavencode-pom", "Incorrect project name");
      done();
    });

  });


  it("search by text", function (done) {
    service.search('spring').then(
      (suggestions) => {
        console.log(JSON.stringify(suggestions))
        assert(suggestions, "Suggestion list is null");
        assert(suggestions.length > 0 && suggestions.length <= 10, "Max number of suggestions must be less than 10");
        done();
      },
      (err) => {
        assert(false, err.message);
        
        done();
        
        console.log('reject called')
      }
    );
  })
})


