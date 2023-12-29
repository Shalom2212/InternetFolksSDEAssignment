const asyncHandler = require("express-async-handler");
const validator = require("validator");
const { Snowflake } = require("@theinternetfolks/snowflake");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createRole = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!validator.default.isLength(name, { min: 2 })) {
    return res.status(400).json({
      status: false,
      errors: [
        {
          param: "name",
          message: "Name should be at least 2 characters.",
          code: "INVALID_INPUT",
        },
      ],
    });
  }

  try {
    const data = await prisma.role.create({
      data: {
        id: Snowflake.generate(),
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      status: true,
      content: {
        data,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: "INTERNAL SERVER ERROR",
    });
  } finally {
    await prisma.$disconnect();
  }
});

const getAllRoles = asyncHandler(async (req, res) => {
  const pageNumber = 1;
  const pageSize = 10;

  try {
    const totalcount = await prisma.role.count();
    const totalPage = Math.ceil(totalcount / pageSize);
    const skip = (pageNumber - 1) * pageSize;

    const data = await prisma.role.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      status: true,
      content: {
        meta: {
          total: totalcount,
          pages: totalPage,
          page: pageNumber,
        },
        data,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: "INTERNAL SERVER ERROR",
    });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = { createRole, getAllRoles };
