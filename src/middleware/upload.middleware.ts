import multer from "multer";
import path from "path";
import { Request } from "express";

// Configure storage for communities
const communityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/communities");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Configure storage for properties
const propertyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store photos and videos in separate directories
    const isVideo = file.mimetype.startsWith("video/");
    const uploadPath = isVideo
      ? "uploads/properties/videos"
      : "uploads/properties/photos";
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for communities
const communityFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and WEBP are allowed."));
  }
};

// File filter for properties
const propertyFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP, MP4, MOV and AVI are allowed."
      )
    );
  }
};

// Configure upload for communities
export const uploadCommunity = multer({
  storage: communityStorage,
  fileFilter: communityFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure upload for properties
export const uploadProperty = multer({
  storage: propertyStorage,
  fileFilter: propertyFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});

// Helper middleware to handle property uploads
export const uploadPropertyFiles = uploadProperty.fields([
  { name: "photos", maxCount: 5 }, // Allow up to 10 photos
  { name: "video", maxCount: 1 }, // Allow 1 video
]);

// Configure storage for agent profile photos
const agentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/agents");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for agent profile photos and videos
const agentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    (file.fieldname === "heroVideo" &&
      allowedVideoTypes.includes(file.mimetype))
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP for images and MP4, MOV, AVI for videos are allowed."
      )
    );
  }
};

// Configure upload for agent profile photos and videos
export const uploadAgentProfile = multer({
  storage: agentStorage,
  fileFilter: agentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos and images
  },
});

// Helper middleware for agent profile photo upload
export const uploadAgentProfilePhoto =
  uploadAgentProfile.single("profilePhoto");

// Helper middleware for agent asset uploads (profilePhoto, logo, heroImage, heroVideo)
export const uploadAgentAssets = uploadAgentProfile.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "heroImage", maxCount: 1 },
  { name: "heroVideo", maxCount: 1 },
]);
