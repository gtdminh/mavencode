let vscode = require('vscode');
let Maven = require('./maven')

const Disposable= vscode.Disposable;
const InputBoxOptions = vscode.InputBoxOptions;

class Controller{
  constructor(){
  
    this.disposable = null;
    
    this.service = new Maven(vscode);
  }
  
  init(){
    let self = this;
    this.disposable =  Disposable.from( 
      vscode.commands.registerCommand('mavencode.init', function(){ self.onCmdInit()}),
      vscode.commands.registerCommand('mavencode.addPkg', this.onCmdAddPkg)
      
    );
    
  }
  
  onCmdInit(){
    var service = this.service;
    vscode.window.showInputBox({placeHolder:"com.groupid:artifactid", prompt:"Enter ProjectId"}).then(function(value){
      if(value != void 0){
        vscode.window.showQuickPick(["minimal","EE minimal"]).then(function(kind){
          let k = kind == "EE minimal" ? "ee":""
          service.init(value,k);
        })
      }
    })
  }
  
  onCmdAddPkg(){
    let service = this.service;
    vscode.window.showInputBox({value:"", placeHolder:"Package name to look for ", prompt:"Search for package"}).then((value) => {
      if(value != void 0 && value != ""){
        service.search(value).then((suggestions) => {
          vscode.window.showQuickPick(suggestions.map((item) => item.id),{placeHolder:"Select an artifact"}).then((artifact) => {
            service.addPkg(artifact);
          })
        })
      }
    })
  }
  
  dispose(){
    this.disposable.dispose();
  }
  
}

module.exports = Controller;