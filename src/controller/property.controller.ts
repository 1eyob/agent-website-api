import { Request, Response } from "express";
import {
  PrismaClient,
  PropertyType,
  PropertyStatus,
  Agent,
} from "@prisma/client";
import { z } from "zod";
import { ParsedQs } from "qs";

const prisma = new PrismaClient();

// Extend Express Request type to include user and files
interface AuthenticatedRequest extends Request {
  user?: Agent;
  files?: {
    photos?: Express.Multer.File[];
    video?: Express.Multer.File[];
  };
}

// Validation schema for property creation
const createPropertySchema = z.object({
  type: z.nativeEnum(PropertyType).optional(),
  title: z.string().min(1, "Title is required"),
  address: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  status: z.nativeEnum(PropertyStatus),
  communityId: z.string().min(1, "Community is required").optional(),
  isFeatured: z.boolean().optional(),
  bedrooms: z.number().int().positive("Bedrooms must be positive").optional(),
  bathrooms: z.number().int().positive("Bathrooms must be positive").optional(),
  description: z.string().min(1, "Description is required"),
  squareFootage: z
    .number()
    .int()
    .positive("Square footage must be positive")
    .optional(),
  yearBuilt: z
    .number()
    .int()
    .positive("Year built must be positive")
    .optional(),
  lotSize: z.number().int().positive("Lot size must be positive").optional(),
  garage: z.number().int().min(0, "Garage must be non-negative").optional(),
  features: z.array(z.string()).optional(),
  link: z.string().url("Invalid property link"),
});

// Helper function to format property data before validation
const formatPropertyData = (data: any) => {
  const formatted = { ...data };

  // Convert numeric strings to numbers
  const numericFields = [
    "price",
    "bedrooms",
    "bathrooms",
    "squareFootage",
    "yearBuilt",
    "lotSize",
    "garage",
  ];
  numericFields.forEach((field) => {
    if (formatted[field] !== undefined) {
      formatted[field] = Number(formatted[field]);
    }
  });

  // Parse features if it's a string
  if (typeof formatted.features === "string") {
    try {
      formatted.features = JSON.parse(formatted.features);
    } catch {
      console.log("Error parsing features:", formatted.features);
      formatted.features = [formatted.features]; // Fallback to single item array
    }
  }

  return formatted;
};

// Helper function to normalize file paths
const normalizePath = (path: string) => {
  // First normalize backslashes to forward slashes
  const normalized = path.replace(/\\/g, "/");
  // Ensure path starts with a forward slash
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

export const createProperty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    console.log("Request:", req.body);
    const agentId = req.agent?.id;
    if (!agentId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Format the data before validation
    const formattedData = formatPropertyData(req.body);

    // Validate request body with formatted data
    const validatedData = createPropertySchema.parse(formattedData);

    // Get uploaded files
    const files = req.files;
    console.log("Files:", files);
    if (!files?.photos || files.photos.length === 0) {
      console.log("No photos uploaded");
      res.status(400).json({ message: "At least one photo is required" });
      return;
    }

    // Create property with normalized file paths
    const property = await prisma.property.create({
      data: {
        ...validatedData,
        agentId,
        photos: files.photos.map((photo) => normalizePath(photo.path)),
        videoUrl: files.video?.[0] ? normalizePath(files.video[0].path) : null,
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
      return;
    }

    console.error("Error creating property:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Validation schema for property update
const updatePropertySchema = createPropertySchema.partial();

export const updateProperty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const agentId = req.agent?.id;
    const propertyId = req.params.id;

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if property exists and belongs to the agent
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        agentId,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Format the data before validation
    const formattedData = formatPropertyData(req.body);

    // Validate request body with formatted data
    const validatedData = updatePropertySchema.parse(formattedData);

    // Get uploaded files if any
    const files = req.files;
    const updateData: any = { ...validatedData };

    // Handle photos update
    if (files?.photos && files.photos.length > 0) {
      updateData.photos = files.photos.map((photo) =>
        normalizePath(photo.path)
      );
    }

    // Handle video update
    if (files?.video && files.video.length > 0) {
      updateData.videoUrl = normalizePath(files.video[0].path);
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
          },
        },
        community: true,
      },
    });

    res.status(200).json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error updating property:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getProperties = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get query parameters for filtering
    const {
      type,
      status,
      isFeatured,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      page = "1",
      limit = "10",
    } = req.query;

    // Build filter object
    const filter: any = { agentId };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.lte = parseInt(maxPrice as string);
    }
    if (bedrooms) filter.bedrooms = parseInt(bedrooms as string);
    if (bathrooms) filter.bathrooms = parseInt(bathrooms as string);

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const total = await prisma.property.count({ where: filter });

    // Fetch properties with pagination
    const properties = await prisma.property.findMany({
      where: filter,
      skip,
      take: limitNumber,
      orderBy: {
        id: "desc",
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
          },
        },
      },
    });

    res.status(200).json({
      properties,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getPropertyById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const agentId = req.user?.id;
    const propertyId = req.params.id;

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        agentId,
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json({ property });
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getPropertiesByCommunity = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const subdomain = req.query.subdomain as string;
    console.log("got it,", communityId, subdomain);
    const {
      search,
      type,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minSquareFootage,
      maxSquareFootage,
      minYearBuilt,
      maxYearBuilt,
      minLotSize,
      maxLotSize,
      features,
      sortBy = "price",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    // Find community by both subdomain and communityId
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        agent: {
          subdomain: subdomain,
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!community) {
      return res.status(404).json({
        message:
          "Community not found or does not belong to the specified agent",
      });
    }

    // Build filter object
    const filter: any = {
      communityId: community.id,
    };

    // Add search filter if provided
    if (search) {
      filter.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { address: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Add other filters
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.lte = parseInt(maxPrice as string);
    }

    // Square footage range filter
    if (minSquareFootage || maxSquareFootage) {
      filter.squareFootage = {};
      if (minSquareFootage)
        filter.squareFootage.gte = parseInt(minSquareFootage as string);
      if (maxSquareFootage)
        filter.squareFootage.lte = parseInt(maxSquareFootage as string);
    }

    // Year built range filter
    if (minYearBuilt || maxYearBuilt) {
      filter.yearBuilt = {};
      if (minYearBuilt) filter.yearBuilt.gte = parseInt(minYearBuilt as string);
      if (maxYearBuilt) filter.yearBuilt.lte = parseInt(maxYearBuilt as string);
    }

    // Lot size range filter
    if (minLotSize || maxLotSize) {
      filter.lotSize = {};
      if (minLotSize) filter.lotSize.gte = parseInt(minLotSize as string);
      if (maxLotSize) filter.lotSize.lte = parseInt(maxLotSize as string);
    }

    // Features filter (array of features)
    if (features) {
      const featureArray =
        typeof features === "string"
          ? features.split(",").map((f) => f.trim())
          : Array.isArray(features)
          ? features.map((f) => String(f).trim())
          : [];

      if (featureArray.length > 0) {
        filter.features = {
          hasEvery: featureArray,
        };
      }
    }

    if (bedrooms) filter.bedrooms = parseInt(bedrooms as string);
    if (bathrooms) filter.bathrooms = parseInt(bathrooms as string);

    // Validate sort parameters
    const validSortFields = [
      "price",
      "bedrooms",
      "bathrooms",
      "squareFootage",
      "yearBuilt",
      "lotSize",
      "garage",
    ];
    const validSortOrders = ["asc", "desc"];

    const finalSortBy = validSortFields.includes(sortBy as string)
      ? sortBy
      : "price";
    const finalSortOrder = validSortOrders.includes(sortOrder as string)
      ? sortOrder
      : "desc";

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const total = await prisma.property.count({ where: filter });

    // Fetch properties with pagination and sorting
    const properties = await prisma.property.findMany({
      where: filter,
      skip,
      take: limitNumber,
      orderBy: {
        [finalSortBy as string]: finalSortOrder,
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
            profilePhoto: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    res.status(200).json({
      properties,
      community,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      filters: {
        search,
        type,
        status,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        minSquareFootage,
        maxSquareFootage,
        minYearBuilt,
        maxYearBuilt,
        minLotSize,
        maxLotSize,
        features:
          typeof features === "string"
            ? features.split(",").map((f) => f.trim())
            : Array.isArray(features)
            ? features.map((f) => String(f).trim())
            : undefined,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder,
      },
    });
  } catch (error) {
    console.error("Error fetching properties by community:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getPropertiesByAgent = async (req: Request, res: Response) => {
  try {
    const subdomain = req.query.subdomain as string;
    const {
      search,
      type,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minSquareFootage,
      maxSquareFootage,
      minYearBuilt,
      maxYearBuilt,
      minLotSize,
      maxLotSize,
      features,
      sortBy = "price",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    // Find agent by subdomain
    const agent = await prisma.agent.findUnique({
      where: { subdomain },
      select: {
        id: true,
        fullName: true,
        email: true,
        subdomain: true,
        profilePhoto: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Build filter object
    const filter: any = {
      agentId: agent.id,
    };

    // Add search filter if provided
    if (search) {
      filter.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { address: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Add other filters
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.lte = parseInt(maxPrice as string);
    }

    // Square footage range filter
    if (minSquareFootage || maxSquareFootage) {
      filter.squareFootage = {};
      if (minSquareFootage)
        filter.squareFootage.gte = parseInt(minSquareFootage as string);
      if (maxSquareFootage)
        filter.squareFootage.lte = parseInt(maxSquareFootage as string);
    }

    // Year built range filter
    if (minYearBuilt || maxYearBuilt) {
      filter.yearBuilt = {};
      if (minYearBuilt) filter.yearBuilt.gte = parseInt(minYearBuilt as string);
      if (maxYearBuilt) filter.yearBuilt.lte = parseInt(maxYearBuilt as string);
    }

    // Lot size range filter
    if (minLotSize || maxLotSize) {
      filter.lotSize = {};
      if (minLotSize) filter.lotSize.gte = parseInt(minLotSize as string);
      if (maxLotSize) filter.lotSize.lte = parseInt(maxLotSize as string);
    }

    // Features filter
    if (features) {
      const featureArray =
        typeof features === "string"
          ? features.split(",").map((f) => f.trim())
          : Array.isArray(features)
          ? features.map((f) => String(f).trim())
          : [];

      if (featureArray.length > 0) {
        filter.features = { hasEvery: featureArray };
      }
    }

    if (bedrooms) filter.bedrooms = parseInt(bedrooms as string);
    if (bathrooms) filter.bathrooms = parseInt(bathrooms as string);

    // Validate sort parameters
    const validSortFields = [
      "price",
      "bedrooms",
      "bathrooms",
      "squareFootage",
      "yearBuilt",
      "lotSize",
      "garage",
    ];
    const validSortOrders = ["asc", "desc"];

    const finalSortBy = validSortFields.includes(sortBy as string)
      ? sortBy
      : "price";
    const finalSortOrder = validSortOrders.includes(sortOrder as string)
      ? sortOrder
      : "desc";

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const total = await prisma.property.count({ where: filter });

    // Fetch properties with pagination and sorting
    const properties = await prisma.property.findMany({
      where: filter,
      skip,
      take: limitNumber,
      orderBy: {
        [finalSortBy as string]: finalSortOrder,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    res.status(200).json({
      properties,
      agent,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      filters: {
        search,
        type,
        status,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        minSquareFootage,
        maxSquareFootage,
        minYearBuilt,
        maxYearBuilt,
        minLotSize,
        maxLotSize,
        features:
          typeof features === "string"
            ? features.split(",").map((f) => f.trim())
            : Array.isArray(features)
            ? features.map((f) => String(f).trim())
            : undefined,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder,
      },
    });
  } catch (error) {
    console.error("Error fetching properties by agent:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteProperty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const agentId = req.agent?.id;
    const propertyId = req.params.id;

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if property exists and belongs to the agent
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        agentId,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Delete the property (this will cascade delete any related records)
    await prisma.property.delete({
      where: { id: propertyId },
    });

    // Note: The files (photos and videos) will need to be cleaned up
    // by a separate cleanup job or process since we don't want to block
    // the delete operation with file system operations

    res.status(200).json({
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
