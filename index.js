import express from "express"
import path from "path"
import http from "http"

const app = express()

const server = http.createServer(app);

app.use(express.static(path.resolve("./public")))
server.listen(3000,console.log("server running h be"))