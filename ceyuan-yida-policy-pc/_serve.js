const http=require('http'),fs=require('fs'),path=require('path');
const PORT=8123,ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json'};
const srv=http.createServer((req,res)=>{
  try{
    let u=decodeURIComponent(req.url.split('?')[0]);
    if(u==='/') u='/index.html';
    const fp=path.join(ROOT,u);
    if(!fp.startsWith(ROOT)){res.writeHead(403);return res.end('Forbidden');}
    if(!fs.existsSync(fp)||!fs.statSync(fp).isFile()){res.writeHead(404);return res.end('Not found: '+u);}
    const ext=path.extname(fp).toLowerCase();
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(fp).pipe(res);
  }catch(e){res.writeHead(500);res.end(String(e));}
});
srv.listen(PORT,'127.0.0.1',()=>console.log('OK http://127.0.0.1:'+PORT));
