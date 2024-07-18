
import express from 'express'
import logger from 'morgan'

import { Server } from 'socket.io' //
import { createServer } from 'node:http'// para crear servidor http

const port = process.env.PORT || 3000



const app = express()
const server = createServer(app)
const io = new Server(server)

io.on('connection', (socket)=>{
    console.log('an user has connected')

    socket.on('disconnect',()=> {console.log('an user has disconnected')})
})
app.use(logger('dev'))

app.use('/', (req, res)=>{
    res.sendFile(process.cwd() + '/client/index.html')
})

// app.listen (port, ()=>{
//     console.log(`server running on port ${port}`)
// }) esto es para escuchar el server de express y ahora lo haremos con el server de ScoketIO abajo:

server.listen(port, ()=>{
    console.log(`server running on port ${port}`)
})