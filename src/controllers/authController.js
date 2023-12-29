const asyncHandler = require("express-async-handler");
const validator = require("validator");
const { Snowflake } = require("@theinternetfolks/snowflake");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  extractDataFromToken,
} = require("../utils/authUtil");

const prisma = new PrismaClient();
const isvalid = validator.default;

const signUp = asyncHandler(async (req, res) => {
  let errors = [];
  const { name, email, password } = req.body;
  if (name == null || email == null || password == null) {
    return res.status(400).json({
      message: "All parameters are required",
    });
  }
  if (!isvalid.isLength(name, { min: 2 })) {
    errors.push({
      param: "name",
      message: "Name should be at least 2 characters.",
      code: "INVALID_INPUT",
    });
  }
  if (!isvalid.isLength(password, { min: 6 })) {
    errors.push({
      param: "Password",
      message: "Password should be at least 2 characters.",
      code: "INVALID_INPUT",
    });
  }
  if (!isvalid.isEmail(email)) {
    errors.push({
      param: "Email",
      message: "Invalid email",
      code: "INVALID_INPUT",
    });
  }
  if (errors.length != 0) {
    return res.status(400).json({
      status: false,
      errors: [errors],
    });
  }

  try {
    const useremail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (useremail !== null)
      return res.status(400).json({
        status: false,
        errors: [
          {
            param: "email",
            message: "User with this email address already exists.",
            code: "RESOURCE_EXISTS",
          },
        ],
      });

    const hashedpwd = await bcrypt.hash(password, 10);
    const data = await prisma.user.create({
      data: {
        id: Snowflake.generate(),
        name: name,
        email: email,
        password: hashedpwd,
        created_at: new Date().toISOString(),
      },
    });

    delete data.password;

    let newAccessToken = generateAccessToken({ ...data });

    return res.status(200).json({
      status: true,
      content: {
        data,
        meta: {
          access_token: newAccessToken,
        },
      },
    });
  } catch (e) {
    console.log(e);
  } finally {
    await prisma.$disconnect();
  }
});

const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isvalid.isEmail(email)) {
    return res.status(400).json({
      status: false,
      errors: [
        {
          param: "email",
          message: "Please provide a valid email address.",
          code: "INVALID_INPUT",
        },
      ],
    });
  }

  const resultdata = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (resultdata == null) {
    return res.status(404).json({
      status: false,
      errors: [
        {
          param: "email",
          message: "email not exist",
          code: "NOT_FOUND",
        },
      ],
    });
  }

  const match = await bcrypt.compare(password, resultdata.password);
  if (!match) {
    return res.status(400).json({
      status: false,
      errors: [
        {
          param: "password",
          message: "The credentials you provided are invalid.",
          code: "INVALID_CREDENTIALS",
        },
      ],
    });
  }

  delete resultdata.password;

  let newAccessToken = generateAccessToken({ ...resultdata });

  return res.status(200).json({
    status: true,
    content: {
      data: { ...resultdata },
      meta: {
        access_token: newAccessToken,
      },
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const token = req.token;
  try {
    const extractdata = extractDataFromToken(token).user;
    return res.status(200).json({
      status: true,
      content: {
        data: {
          ...extractdata,
        },
      },
    });
  } catch (e) {
    return res.status(401).json({
      status: false,
      errors: [
        {
          message: "You need to sign in to proceed.",
          code: "NOT_SIGNEDIN",
        },
      ],
    });
  }
});

module.exports = { signUp, signIn, getMe };
