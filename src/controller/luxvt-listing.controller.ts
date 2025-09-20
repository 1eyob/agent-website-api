import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for a single LuxVT listing
const singleLuxvtListingSchema = z.object({
  listingId: z.string(),
  address: z.string(),
  photo: z.string().url(),
  website: z.string().url(),
  city: z.string(),
  state: z.string(),
  currency: z.string(),
  squareFeet: z.string(),
  unitOfMeasurement: z.string(),
  propertyName: z.string(),
  price: z.string(),
});

// Validation schema for creating/upserting multiple LuxVT listings
const upsertLuxvtListingsSchema = z.object({
  listings: z
    .array(singleLuxvtListingSchema)
    .min(1, "At least one listing is required"),
});

// Validation schema for updating a single LuxVT listing
const updateLuxvtListingSchema = singleLuxvtListingSchema.partial();

// Upsert multiple LuxVT listings for an agent
export const upsertLuxvtListings = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const { listings } = upsertLuxvtListingsSchema.parse(req.body);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ listingId: string; error: string }>,
    };

    // Process each listing
    for (const listingData of listings) {
      try {
        // Use upsert to either create or update based on listingId and agentId
        // Check if listing exists
        const existingListing = await prisma.luxvtListing.findFirst({
          where: {
            listingId: listingData.listingId,
            agentId: agentId,
          },
        });

        let upsertedListing;
        if (existingListing) {
          // Update existing listing
          upsertedListing = await prisma.luxvtListing.update({
            where: { id: existingListing.id },
            data: {
              address: listingData.address,
              photo: listingData.photo,
              website: listingData.website,
              city: listingData.city,
              state: listingData.state,
              currency: listingData.currency,
              squareFeet: listingData.squareFeet,
              unitOfMeasurement: listingData.unitOfMeasurement,
              propertyName: listingData.propertyName,
              price: listingData.price,
            },
          });
        } else {
          // Create new listing
          upsertedListing = await prisma.luxvtListing.create({
            data: {
              ...listingData,
              agentId: agentId,
            },
          });
        }

        // Track if it was an update or create
        if (existingListing) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        console.error(
          `Error upserting listing ${listingData.listingId}:`,
          error
        );
        results.errors.push({
          listingId: listingData.listingId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const statusCode = results.errors.length > 0 ? 207 : 200; // 207 Multi-Status if there are errors

    res.status(statusCode).json({
      message: "LuxVT listings processed successfully",
      results: {
        total: listings.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors.length,
        errorDetails: results.errors,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error upserting LuxVT listings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a single LuxVT listing for an agent (kept for backward compatibility)
export const createLuxvtListing = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const data = singleLuxvtListingSchema.parse(req.body);

    // Check if listing exists
    const existingListing = await prisma.luxvtListing.findFirst({
      where: {
        listingId: data.listingId,
        agentId: agentId,
      },
    });

    let luxvtListing;
    let wasCreated = false;

    if (existingListing) {
      // Update existing listing
      luxvtListing = await prisma.luxvtListing.update({
        where: { id: existingListing.id },
        data: {
          address: data.address,
          photo: data.photo,
          website: data.website,
          city: data.city,
          state: data.state,
          currency: data.currency,
          squareFeet: data.squareFeet,
          unitOfMeasurement: data.unitOfMeasurement,
          propertyName: data.propertyName,
          price: data.price,
        },
      });
    } else {
      // Create new listing
      luxvtListing = await prisma.luxvtListing.create({
        data: {
          ...data,
          agentId: agentId,
        },
      });
      wasCreated = true;
    }

    res.status(wasCreated ? 201 : 200).json({
      message: wasCreated
        ? "LuxVT listing created successfully"
        : "LuxVT listing updated successfully",
      data: luxvtListing,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error creating/updating LuxVT listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all LuxVT listings for an agent
export const getLuxvtListings = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const listings = await prisma.luxvtListing.findMany({
      where: {
        agentId: agentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "LuxVT listings retrieved successfully",
      data: listings,
    });
  } catch (error) {
    console.error("Error fetching LuxVT listings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific LuxVT listing by ID
export const getLuxvtListingById = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const { id } = req.params;

    const listing = await prisma.luxvtListing.findFirst({
      where: {
        id: id,
        agentId: agentId,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "LuxVT listing not found" });
    }

    res.status(200).json({
      message: "LuxVT listing retrieved successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Error fetching LuxVT listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a LuxVT listing
export const updateLuxvtListing = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const { id } = req.params;
    const data = updateLuxvtListingSchema.parse(req.body);

    // Check if listing exists and belongs to this agent
    const existingListing = await prisma.luxvtListing.findFirst({
      where: {
        id: id,
        agentId: agentId,
      },
    });

    if (!existingListing) {
      return res.status(404).json({ error: "LuxVT listing not found" });
    }

    // If updating listingId, check it doesn't conflict with another listing
    if (data.listingId && data.listingId !== existingListing.listingId) {
      const conflictingListing = await prisma.luxvtListing.findFirst({
        where: {
          listingId: data.listingId,
          agentId: agentId,
          id: { not: id },
        },
      });

      if (conflictingListing) {
        return res.status(400).json({
          error: "Another listing with this ID already exists for this agent",
        });
      }
    }

    const updatedListing = await prisma.luxvtListing.update({
      where: { id: id },
      data: data,
    });

    res.status(200).json({
      message: "LuxVT listing updated successfully",
      data: updatedListing,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error updating LuxVT listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a LuxVT listing
export const deleteLuxvtListing = async (req: Request, res: Response) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Agent not authenticated" });
    }

    const { id } = req.params;

    // Check if listing exists and belongs to this agent
    const existingListing = await prisma.luxvtListing.findFirst({
      where: {
        id: id,
        agentId: agentId,
      },
    });

    if (!existingListing) {
      return res.status(404).json({ error: "LuxVT listing not found" });
    }

    await prisma.luxvtListing.delete({
      where: { id: id },
    });

    res.status(200).json({
      message: "LuxVT listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting LuxVT listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get LuxVT listings for a specific agent by subdomain (public endpoint)
export const getLuxvtListingsBySubdomain = async (
  req: Request,
  res: Response
) => {
  try {
    const { subdomain } = req.query;

    if (!subdomain || typeof subdomain !== "string") {
      return res.status(400).json({ error: "Subdomain is required" });
    }

    // First find the agent by subdomain
    const agent = await prisma.agent.findUnique({
      where: { subdomain: subdomain },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const listings = await prisma.luxvtListing.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "LuxVT listings retrieved successfully",
      data: listings,
    });
  } catch (error) {
    console.error("Error fetching LuxVT listings by subdomain:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
