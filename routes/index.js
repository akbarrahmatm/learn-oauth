const router = require("express").Router();

/*
    Import other routers here, for example:
    const authRouter = require("./authRouter");
*/
const authRouter = require("./authRouter");

/*
    Define other routes here, for example:
    router.use("/api/v1/auth", authRouter);
*/
router.use("/auth", authRouter);

module.exports = router;
