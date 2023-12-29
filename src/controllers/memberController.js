const asyncHandler = require("express-async-handler");
const { Snowflake } = require("@theinternetfolks/snowflake");
const { PrismaClient } = require("@prisma/client");
const { extractDataFromToken } = require("../utils/authUtil");

const prisma = new PrismaClient();

const addMember = asyncHandler(async (req, res) => {
  const token = req.token;
  let extractedOwnerId;

  const { community, user, role } = req.body;

  if (!community || !user || !role) {
    return res.status(400).json({
      message: "All Parameters are required!",
    });
  }

  try {
    extractedOwnerId = extractDataFromToken(token).user.id;
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
    const isCommunity = await prisma.community.findUnique({
      where: {
        id: community,
      },
    });

    if (isCommunity === null) {
      return res.status(400).json({
        status: false,
        errors: [
          {
            param: "community",
            message: "Community not found.",
            code: "RESOURCE_NOT_FOUND",
          },
        ],
      });
    }

    const ownerID = await prisma.community.findUnique({
      where: {
        id: community,
      },
      select: {
        owner: true,
      },
    });

    if (extractedOwnerId !== ownerID.owner) {
      return res.status(401).json({
        status: false,
        errors: [
          {
            message: "You are not authorized to perform this action.",
            code: "NOT_ALLOWED_ACCESS",
          },
        ],
      });
    }

    const isRole = await prisma.role.findUnique({
      where: {
        id: role,
      },
    });

    if (isRole === null) {
      return res.status(400).json({
        status: false,
        errors: [
          {
            param: "role",
            message: "Role not found.",
            code: "RESOURCE_NOT_FOUND",
          },
        ],
      });
    }

    const isUser = await prisma.user.findUnique({
      where: {
        id: user,
      },
    });

    if (isUser === null) {
      return res.status(400).json({
        status: false,
        errors: [
          {
            param: "user",
            message: "User not found.",
            code: "RESOURCE_NOT_FOUND",
          },
        ],
      });
    }

    const isUserExist = await prisma.member.findFirst({
      where: {
        user: user,
        community: community,
      },
    });

    if (isUserExist !== null) {
      return res.status(400).json({
        status: false,
        errors: [
          {
            message: "User is already added in the community.",
            code: "RESOURCE_EXISTS",
          },
        ],
      });
    }

    const data = await prisma.member.create({
      data: {
        id: Snowflake.generate(),
        community: community,
        user: user,
        role: role,
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
    return res.status(500).json({
      error: "INTERNAL SERVER ERROR",
    });
  } finally {
    await prisma.$disconnect();
  }
});

const removeMember = asyncHandler(async (req, res) => {
  const token = req.token;
  const memberID = req.params.id;
  let extractedOwnerId;
  try {
    extractedOwnerId = extractDataFromToken(token).user.id;
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
    const adminRole = await prisma.role.findMany({
      where: {
        name: "Community Admin",
      },
      select: {
        id: true,
      },
    });

    const moderatorRole = await prisma.role.findMany({
      where: {
        name: "Community Moderator",
      },
      select: {
        id: true,
      },
    });

    const isOwner = await prisma.member.findFirst({
      where: {
        OR: [
          {
            user: extractedOwnerId,
            role: adminRole.id,
          },
          {
            user: extractedOwnerId,
            role: moderatorRole.id,
          },
        ],
      },
    });

    if (isOwner === null) {
      return res.status(400).json({
        status: false,
        errors: [
          {
            message: "You are not authorized to perform this action.",
            code: "NOT_ALLOWED_ACCESS",
          },
        ],
      });
    }

    const isMember = await prisma.member.findUnique({
      where: {
        id: memberID,
      },
    });

    if (isMember === null) {
      return res.status(404).json({
        status: false,
        errors: [
          {
            message: "Member not found.",
            code: "RESOURCE_NOT_FOUND",
          },
        ],
      });
    }

    const data = await prisma.member.delete({
      where: {
        id: memberID,
      },
    });
    console.log(data);
    return res.status(200).json({
      status: true,
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

module.exports = { addMember, removeMember };
