import dotenv from 'dotenv' 
import { createClient } from '@libsql/client'

import express from 'express'
import logger from 'morgan'

import { Server } from 'socket.io' //
import { createServer } from 'node:http'// para crear servidor http

dotenv.config()

const port = process.env.PORT || 3000

const db = createClient({
    url:process.env.DB_URL,
    authToken: process.env.DB_TOKEN
})

await db.execute(`CREATE TABLE IF NOT EXISTS messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT 
    )`)

const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery:{}
})

io.on('connection', async (socket)=>{
    console.log('an user has connected')

    socket.on('disconnect',()=> {
      console.log("an user has disconnected")
    })
    socket.on('chat message', async (msg)=> { 
        let result
        try{
            result= await db.execute({
                sql: `INSERT INTO messages (content) VALUES (:content)`,
                args:{content: msg}
            })
        }catch(e){
            console.error(e)
        }
        io.emit('chat message', msg, result.lastInsertRowid.toString())
    })
    console.log('auth: ')
    console.log(socket.handshake.auth);
    if (!socket.recovered){
        try{
            const results = await db.execute({
                sql:'SELECT id, content FROM messages WHERE id > ?',
                args:[socket.handshake.auth.serverOffset ?? 0]
            })
            results.rows.forEach(row =>{
                socket.emit('chat message', row.content, row.id.toString())
            })
        }catch{
            (e)=>{
            console.error(e)
        }

        }
    }
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