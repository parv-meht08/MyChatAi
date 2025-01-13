import jwt from 'jsonwebtoken'
import redisClient from '../services/radis.service.js'

export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization').replace(/^Bearer\s+/i, '');

        if(!token) {
            return res.status(401).json({ error: "UnAuthorized User" });
        }

        const isBlacklisted = await redisClient.get(token);
        if(isBlacklisted) {
            res.cokkie('token', '');
            return res.status(401).json({ error: "UnAuthorized User" });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: "UnAuthorized User" });
    }
}