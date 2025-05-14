import mongoose from 'mongoose';

export const WORK_TYPES = ['Remote', 'Hybrid', 'Onsite'];
export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    workType: {
      type: String,
      enum: WORK_TYPES,
      default: 'Remote',
      required: true
    },
    jobType: {
      type: String,
      enum: JOB_TYPES,
      default: 'Full-time',
      required: true
    },
    skills: {
      type: [String],
      default: [],
      set: (arr) => arr.map(s => s.trim().toLowerCase()).filter(Boolean)
    },
    salaryRange: {
      type: String,
      default: ''
    },
    applyLink: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      default: 'Manual'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
