import asyncHandler from '../utils/asyncHandler.js';
import WaitlistEntry from '../models/WaitlistEntry.js';

export const addToWaitlist = asyncHandler(async (req, res) => {
  const { name, email, interest } = req.body;
  if (!name || !email || !interest) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const exists = await WaitlistEntry.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'This email is already on the waitlist.' });
  }

  const entry = await WaitlistEntry.create({ name, email, interest });
  res.status(201).json({ message: 'Successfully added to the waitlist.', entry });
});
