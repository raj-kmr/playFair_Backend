const sessionService = require("../services/session.service")

// - Validate request  shape
// - Calls Service
// - sends Http response

export const  sessionsController = {
    async start(req, res, next) {
        try {
            const userId = req.user.id;
            const gameId = Number(req.params.id);

            if(!Number.isInteger(gameId)){
                return res.status(400).json({message: "Invalid game ID"});
            }

            const session = await sessionService.startSession({userId, gameId});

            res.status(201).json({session, message: "Session Started"});
        } catch(err) {
            next(err);
        }
    },

    async end(req, res, next) {
        try {
            const userId = req.user.id;

            const session = await sessionService.endActiveSession({userId})

            res.status(200).json({session, message: "Session Ended"});
        } catch(err){
            next(err);
        }
    },

    async listByGame(req, res, next){
        try {
            const userId = req.user.id;
            const gameId = Number(req.params.id);

            if(!Number.isInteger(gameId)){
                return res.status(400).json({message: "Invalid game ID"})
            }

            const sessions = await sessionService.listSessionsByGame({userId, gameId})

            res.statu(200).json({ sessions })
        } catch(err) {
            next(err);
        }
    },

    async active(req, res, next ) {
        try {
            const userId = req.user.id;

            const session = await sessionService.getActiveSession({userId})
            res.status(200).json({session})
        } catch(err) {
            next(err)
        }
    }
}