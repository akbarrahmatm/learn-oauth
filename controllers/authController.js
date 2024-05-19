const ApiError = require("../utils/apiError");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

function createToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const googleUser = await User.findOne({
      where: {
        email,
        authType: "google",
      },
    });

    if (googleUser) {
      return next(
        new ApiError("User is already registered with another method", 400)
      );
    }

    const user = await User.findOne({
      where: {
        email,
        authType: "general",
      },
    });

    if (!user) {
      return next(new ApiError("Account not exist", 400));
    }

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = createToken({
        id: user.id,
        username: user.username,
        email: user.email,
      });

      res.status(200).json({
        status: "Success",
        message: "Succesfully logged in",
        data: token,
      });
    } else {
      return next(new ApiError("Wrong Email Or Password", 401));
    }
  } catch (err) {
    return next(new ApiError(err.message, 400));
  }
};

const register = async (req, res, next) => {
  try {
    const { email, name, password, confirmPassword } = req.body;

    // Check unique username
    const isEmailExist = await User.findOne({
      where: {
        email,
        authType: "general",
      },
    });
    if (isEmailExist) {
      return next(new ApiError("Username is already taken", 400));
    }

    const isGoogleUserExist = await User.findOne({
      where: {
        email,
        authType: "google",
      },
    });
    if (isGoogleUserExist) {
      return next(
        new ApiError("User is already registered with another method", 400)
      );
    }

    if (password.length <= 8) {
      return next(new ApiError("Password should be 8 character or more", 400));
    }

    if (password === confirmPassword) {
      const saltRounds = 10;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);

      const user = User.create({
        email,
        name,
        password: hashedPassword,
      });

      if (!user) {
        return next(new ApiError("Unexpected Error", 400));
      }

      res.status(200).json({
        status: "Success",
        message: "User successfully registered",
        requestAt: req.requestTime,
      });
    } else {
      return next(
        new ApiError("Password & Password Confirmation is not match", 400)
      );
    }
  } catch (err) {
    return next(new ApiError(err.message, 400));
  }
};

const getGoogleToken = async (req, res, next) => {
  try {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const url = await oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    res.status(200).json({
      status: "Success",
      message: "Google Auth URL is successfully created",
      data: {
        url,
      },
    });
  } catch (err) {
    return next(new ApiError(err.message, 400));
  }
};

const getGoogleAccountInfo = async (req, res, next) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });

    const { data } = await oauth2.userinfo.get();

    console.log(data);

    const isGeneralUserExist = await User.findOne({
      where: {
        email: data.email,
        authType: "general",
      },
    });

    if (isGeneralUserExist) {
      return next(
        new ApiError("User is already registered with another method", 400)
      );
    }

    const googleUser = await User.findOne({
      where: {
        email: data.email,
        authType: "google",
      },
    });

    let token;
    if (googleUser) {
      // Login Pake google
      token = createToken({
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
      });
    } else {
      // Daftar dan login pake google
      const user = await User.create({
        googleId: data.id,
        email: data.email,
        name: data.name,
        authType: "google",
        avatar: data.picture,
      });

      if (!user) {
        return next(new ApiError("Unexpected Error", 400));
      }

      token = createToken({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Successfully logged in",
      token,
    });
  } catch (err) {
    return next(new ApiError(err.message, 400));
  }
};

module.exports = {
  getGoogleToken,
  getGoogleAccountInfo,
  register,
  login,
};
