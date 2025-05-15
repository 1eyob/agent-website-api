import { Request, Response } from "express";
import {
  PrismaClient,
  PropertyType,
  PropertyStatus,
  Agent,
} from "@prisma/client";
import { z } from "zod";

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
  type: z.nativeEnum(PropertyType),
  title: z.string().min(1, "Title is required"),
  address: z.string().min(1, "Address is required"),
  price: z.number().positive("Price must be positive"),
  status: z.nativeEnum(PropertyStatus),
  communityId: z.string().min(1, "Community is required"),
  isFeatured: z.boolean().optional(),
  bedrooms: z.number().int().positive("Bedrooms must be positive"),
  bathrooms: z.number().int().positive("Bathrooms must be positive"),
  description: z.string().min(1, "Description is required"),
  squareFootage: z.number().int().positive("Square footage must be positive"),
  yearBuilt: z.number().int().positive("Year built must be positive"),
  lotSize: z.number().int().positive("Lot size must be positive"),
  garage: z.number().int().min(0, "Garage must be non-negative"),
  features: z.array(z.string()),
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
    const agentId = req.user?.id;
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

    if (files?.photos) {
      updateData.photos = files.photos.map((photo) =>
        normalizePath(photo.path)
      );
    }
    if (files?.video) {
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
      },
    });

    res.status(200).json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error) {
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
