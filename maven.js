const xml = require('xml');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const http = require('http');
const URL = require('url')

let vscode = {};

/**
 * fetch url in json
 * 
 * @param {any} url 
 * @returns {Promise}
 */
function fetch(url) {
    return new Promise((resolve, reject) => {

        const request = http.get(url, (res) => {
            let data = '';
            const statusCode = res.statusCode;
            const mime = res.headers['content-type'];
            if (statusCode !== 200) {
                reject(new Error(`Request failed ${statusCode}`));
                res.resume();
            } else {
                if (!/^application\/json/.test(mime)) {
                    reject(new Error(`Invalid Mime ${mime}`));
                    res.resume();
                }
                else {
                    res.setEncoding('utf-8');
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        try {
                            var obj = JSON.parse(data);
                            resolve(obj.response.docs);
                        }
                        catch (err) {
                            reject(err);
                        }
                    })
                }
            }
        });
        request.on('error', function (err) {
            reject(err);
        })
    })
}
class MavenCommand {

    constructor(pvscode) {
        vscode = pvscode;
        this.maven = {
            search: 'http://search.maven.org/solrsearch/select?q=a:"{key}"&rows=10&wt=json',
            getDetail: 'http://search.maven.org/solrsearch/select?q=g:"{groupId}"+AND+a:"{artifactId}"&rows=10&wt=json',
            getPom: 'http://search.maven.org/remotecontent?filepath={path}/{version}/{artifactId}-{version}.pom',
            pom: path.resolve(vscode.workspace.rootPath, "pom.xml")
        }
    }

    init(artifactId = "com.company:project", kind = "") {
        let groupId = "groupId";
        if (artifactId.indexOf(".") > 0) {
            groupId = artifactId.substring(0, artifactId.lastIndexOf(":"));
            artifactId = artifactId.substr(artifactId.lastIndexOf(":") + 1);
        }

        const pom = this.maven.pom;
        let pomtemplate = '';
        switch (kind) {
            case 'ee':
                {
                    pomtemplate = path.resolve(vscode.extensions.getExtension('mavencode').extensionPath, 'hbs/ee.pom.hbs');
                    break;
                }
            default:
                {
                    pomtemplate = path.resolve(vscode.extensions.getExtension('mavencode').extensionPath, 'hbs/pom.hbs');
                }
        }

        var content = fs.readFileSync(pomtemplate).toString();
        content = content.replace('{groupId}', groupId).replace('{projId}', artifactId + "-pom").replace('{projName}', artifactId);
        fs.writeFileSync(pom, content);
    }

    /**
     * 
     * @param {stromg} pkg full name of the maven package
     * @returns {Promise} 
     */
    addPkg(pkg) {
        return new Promise((resolve, reject) => {
            let groupId = "";
            let artifactId = "";

            if (pkg.indexOf(".") > 0) {
                groupId = pkg.substring(0, pkg.lastIndexOf(":"));
                artifactId = pkg.substr(pkg.lastIndexOf(":") + 1);
            }

            let url = encodeURI(this.maven.getDetail.replace(/\{groupId\}/g, groupId).replace(/\{artifactId\}/g, artifactId));
            fetch(url).then(
                (items) => {
                    const item = items[0];
                    this.readJson().then(
                        (pomObj) => {
                            if (!pomObj.dependencies.some((it) => it.dependency[0].groupId === item.g && it.dependency[0].artifactId === item.a)) {
                                pomObj.dependencies.push({ dependency: [{ groupId: [item.g], artifactId: [item.a], version: [item.latestVersion], scope: ["provided"] }] });
                                try {
                                    const xmlStr = (new xml2js.Builder()).buildObject(pomObj);
                                    fs.writeFileSync(this.maven.pom, xmlStr);
                                    resolve(pomObj);
                                }
                                catch (err) {
                                    reject(err);
                                }
                            }
                        },
                        (err) => reject(err)
                    );
                },
                (err) => reject(err)
            );

        });
    }

    search(key) {
        const url = this.maven.search.replace('{key}', key);
        return fetch(url);
    }

    dispose() {
        this.maven = null;
    }
    /**
     * @returns {Promise}
     */
    readJson() {
        const content = fs.readFileSync(this.maven.pom).toString();

        return new Promise(function (resolve, reject) {
            xml2js.parseString(content, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = MavenCommand;