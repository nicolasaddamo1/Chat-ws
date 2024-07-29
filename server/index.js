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
    content TEXT,
    user TEXT
    )`)

const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery:{}
})

io.on('connection', async (socket)=>{
    console.log('An user has connected.')

    socket.on('Disconnect',()=> {
      console.log("An user has disconnected.")
    })
    socket.on('chat message', async (msg)=> { 
        let result
        let username = socket.handshake.auth.username ?? 'anonymus'
        try{
            result = await db.execute({
                sql: `INSERT INTO messages (content, user) VALUES (:msg, :username)`,
                args:{msg, username}
            })
        }catch(e){
            console.error(e)
        }
        io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
    })
    if (!socket.recovered){
        try{
            const results = await db.execute({
                sql:'SELECT id, content, user FROM messages WHERE id > ?',
                args:[socket.handshake.auth.serverOffset ?? 0]
            })
            results.rows.forEach(row =>{
                socket.emit('chat message', row.content, row.id.toString(), row.user)
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
    console.log(`server running on port: ${port}`)
})