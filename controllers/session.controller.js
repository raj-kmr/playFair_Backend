const sessionsService = require("../services/session.service");

const sessionsController = {
  async startSession(req, res, next) {
    try {
      /**
       * req.user should come from your JWT middleware.
       * Example:
       * req.user = { id: decoded.id }
       */
      const userId = req.user.id;
      const gameId = Number(req.params.id);

      if (!gameId || isNaN(gameId)) {
        return res.status(400).json({
          message: "Invalid game id",
        });
      }

      const session = await sessionsService.startSession({ userId, gameId });
      
      if(!session){
        return res.status(404).json({message: "Failed to start session"})
      }

      return res.status(200).json({
        message: "Session started successfully",
        session,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
      })
    }
  },

  async endSession(req, res, next) {
    try {
      const userId = req.user.id;

      const session = await sessionsService.endActiveSession({ userId });

      return res.status(200).json({
        message: "Session ended successfully",
        session,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
      })
    }
  },

  async getSessionsByGame(req, res, next) {
    try {
      const userId = req.user.id;
      const gameId = Number(req.params.id);

      if (!gameId || Number.isNaN(gameId)) {
        return res.status(400).json({
          message: "Invalid game id",
        });
      }

      const sessions = await sessionsService.getSessionsByGame({
        userId,
        gameId,
      });

      return res.status(200).json({
        sessions,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
      })
    }
  },

  async getActiveSession(req, res, next) {
    try {
      const userId = req.user.id;

      const activeSession = await sessionsService.getActiveSession({ userId });

      return res.status(200).json({
        activeSession,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
      })
    }
  },
};

module.exports = sessionsController;