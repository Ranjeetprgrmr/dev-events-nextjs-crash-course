import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Event schema definition
const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
      maxlength: [500, 'Overview cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: {
        values: ['online', 'offline', 'hybrid'],
        message: 'Mode must be either online, offline, or hybrid',
      },
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Tags must contain at least one item',
      },
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

// Pre-save hook for slug generation and data normalization
EventSchema.pre('save', function (next) {
  const event = this as IEvent;

  // Generate slug only if title changed or document is new
  if (event.isModified('title') || event.isNew) {
    event.slug = generateSlug(event.title);
  }

  // Normalize date to ISO format if it's not already
  if (event.isModified('date')) {
    event.date = normalizeDate(event.date);
  }

  // Normalize time format (HH:MM)
  if (event.isModified('time')) {
    event.time = normalizeTime(event.time);
  }

  next();
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a URL-friendly slug from a title string
 * Removes special characters, replaces spaces with hyphens
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

/**
 * Normalizes a date string to ISO format (YYYY-MM-DD)
 * Throws error if date is invalid
 */
function normalizeDate(dateString: string): string {
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date format. Please provide a valid date.');
  }
  return parsedDate.toISOString().split('T')[0];
}

/**
 * Normalizes time to 24-hour format (HH:MM)
 * Accepts both 24-hour (HH:MM) and 12-hour (HH:MM AM/PM) formats
 */
function normalizeTime(timeString: string): string {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const time12HourRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

  if (timeRegex.test(timeString)) {
    // Already in 24-hour format, ensure leading zero
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  } else if (time12HourRegex.test(timeString)) {
    // Convert 12-hour format to 24-hour format
    const match = timeString.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  throw new Error('Invalid time format. Use HH:MM or HH:MM AM/PM.');
}

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
