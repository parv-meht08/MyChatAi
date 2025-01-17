import 'dotenv/config'
import http from 'http';
import app from './app.js'
import {Server} from 'socket.io'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import projectModel from './models/project.model.js'

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

io.use(async(socket, next)=>{
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        const projectId = socket.handshake.query?.projectId;
        if(projectId && !mongoose.Types.ObjectId.isValid(projectId)){
            return next(new Error('Invalid Project Id'))
        }

        socket.project = await projectModel.findById(projectId);

        if(!token){
            return next(new Error('Unauthorized'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded){
            return next(new Error('Unauthorized'))
        }
        socket.user = decoded;
        next();

    } catch (error) {
        next(error)
    }
})


io.on('connection', socket => {
    socket.roomId =socket.project._id.toString();

    console.log("a user connected")

    socket.join(socket.roomId);

    socket.on('projectMessage', data => {
        console.log(data)
        socket.broadcast.to(socket.roomId).emit('projectMessage', data)
    })
    
    socket.on('disconnect', () => { 
        console.log("a user disconnected")
        socket.leave(socket.roomId);
     });
});

server.listen(port, ()=> {
    console.log(`Server is runing on port no ${port}`);
})