const router = require("express").Router();

const authController = require("../controllers/authController");
const validateInputs = require("../middlewares/validationInput");

router.get("/google", authController.getGoogleToken);
router.get("/google/callback", authController.getGoogleAccountInfo);
router.post(
  "/register",
  validateInputs([
    {
      field: "email",
      message: "Email is required",
    },
    {
      field: "name",
      message: "Name is required",
    },
    {
      field: "password",
      message: "Password is required",
    },
    {
      field: "confirmPassword",
      message: "Password confirmation is required",
    },
  ]),
  authController.register
);

module.exports = router;
