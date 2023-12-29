const asyncHandler = require("express-async-handler");
const validator = require("validator");
const { Snowflake } = require("@theinternetfolks/snowflake");
const { PrismaClient } = require("@prisma/client");
const { extractDataFromToken } = require("../utils/authUtil");

const prisma = new PrismaClient();
const isvalid = validator.default;

const createCommunity = asyncHandler(async (req, res) => {
  const token = req.token;
  const { name } = req.body;
  if (name == null) {
    return res.status(400).json({ message: "All parameters are required" });
  }
  if (!isvalid.isLength(name, { min: 2 })) {
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
    let extractedId;

    try {
      extractedId = extractDataFromToken(token).user.id;
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

    const data = await prisma.community.create({
      data: {
        id: Snowflake.generate(),
        name: name,
        slug: name.toLowerCase(),
        owner: extractedId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    const Adminrole = await prisma.role.findFirst({
      where: {
        name: "Community Admin",
      },
      select: {
        id: true,
      },
    });

    const newdata = await prisma.member.create({
      data: {
        id: Snowflake.generate(),
        community: data.id,
        role: Adminrole.id,
        user: extractedId,
        created_at: new Date().toISOString(),
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
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  } finally {
    await prisma.$disconnect();
  }
});

const getAllCommunity = asyncHandler(async (req, res) => {
  const pageNumber = 1;
  const pageSize = 10;

  try {
    const totalcount = await prisma.community.count();
    const totalPage = Math.ceil(totalcount / pageSize);
    const skip = (pageNumber - 1) * pageSize;

    const data = await prisma.community.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,

        ownerrel: {
          select: {
            id: true,
            name: true,
          },
        },

        created_at: true,
        updated_at: true,
      },
    });

    let modifiedData = [];

    data.forEach((item) => {
      let modifiedObject = {
        id: item.id,
        name: item.name,
        slug: item.slug,
        owner: item.ownerrel,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      modifiedData.push(modifiedObject);
    });

    return res.status(200).json({
      status: true,
      content: {
        meta: {
          total: totalcount,
          pages: totalPage,
          page: pageNumber,
        },
        data: modifiedData,
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

const getAllCommunityMembers = asyncHandler(async (req, res) => {
  const communityName = req.params.id;
  const pageNumber = 1;
  const pageSize = 10;

  try {
    const communityID = await prisma.community.findUnique({
      where: {
        slug: communityName,
      },
      select: {
        id: true,
      },
    });
    // console.log(communityID);
    // console.log(typeof communityID);
    const totalcount = await prisma.member.count({
      where: {
        community: communityID.id,
      },
    });
    const totalPage = Math.ceil(totalcount / pageSize);
    const skip = (pageNumber - 1) * pageSize;

    const data = await prisma.member.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        community: true,
        userrel: {
          select: {
            id: true,
            name: true,
          },
        },
        rolerel: {
          select: {
            id: true,
            name: true,
          },
        },
        created_at: true,
      },
    });

    let modifiedData = [];

    data.forEach((item) => {
      let modifiedObject = {
        id: item.id,
        community: item.community,
        user: item.userrel,
        role: item.rolerel,
        created_at: item.created_at,
      };
      modifiedData.push(modifiedObject);
    });

    return res.status(200).json({
      status: true,
      content: {
        meta: {
          total: totalcount,
          pages: totalPage,
          page: pageNumber,
        },
        data: modifiedData,
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

const getMyOwnedCommunity = asyncHandler(async (req, res) => {
  const token = req.token;
  let extractedId;
  const pageNumber = 1;
  const pageSize = 10;

  try {
    extractedId = extractDataFromToken(token).user.id;
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

  try {
    const totalcount = await prisma.community.count({
      where: {
        owner: extractedId,
      },
    });
    const totalPage = Math.ceil(totalcount / pageSize);
    const skip = (pageNumber - 1) * pageSize;

    const data = await prisma.community.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        id: "asc",
      },
      where: {
        owner: extractedId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        owner: true,
        created_at: true,
        updated_at: true,
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

const getMyJoinedCommunity = asyncHandler(async (req, res) => {
  const token = req.token;
  let extractedId;
  const pageNumber = 1;
  const pageSize = 10;

  try {
    extractedId = extractDataFromToken(token).user.id;
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

  try {
    const totalcount = await prisma.community.count({
      where: {
        Member: {
          some: {
            user: extractedId,
          },
        },
      },
    });
    const totalPage = Math.ceil(totalcount / pageSize);
    const skip = (pageNumber - 1) * pageSize;

    const data = await prisma.community.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        id: "asc",
      },
      where: {
        Member: {
          some: {
            user: extractedId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerrel: {
          select: {
            id: true,
            name: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    let modifiedData = [];

    data.forEach((item) => {
      let modifiedObject = {
        id: item.id,
        name: item.name,
        slug: item.slug,
        owner: item.ownerrel,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      modifiedData.push(modifiedObject);
    });

    return res.status(200).json({
      status: true,
      content: {
        meta: {
          total: totalcount,
          pages: totalPage,
          page: pageNumber,
        },
        data: modifiedData,
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

module.exports = {
  createCommunity,
  getAllCommunity,
  getAllCommunityMembers,
  getMyOwnedCommunity,
  getMyJoinedCommunity,
};
