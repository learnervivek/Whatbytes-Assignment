import prisma from '../config/db.js';

// Regular expression to validate standard email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 1. Create a new doctor
 * POST /api/doctors/
 */
export const createDoctor = async (req, res, next) => {
  try {
    const { name, specialization, email, phone } = req.body;

    // Validate required fields
    if (!name || !specialization || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, specialization, and email are required fields.'
      });
    }

    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Create doctor in PostgreSQL with createdById set strictly to authenticated user ID
    const newDoctor = await prisma.doctor.create({
      data: {
        name: name.trim(),
        specialization: specialization.trim(),
        email: trimmedEmail,
        phone: phone ? phone.trim() : null,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully.',
      data: newDoctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. List all doctors created by the logged-in user
 * GET /api/doctors/
 */
export const getDoctors = async (req, res, next) => {
  try {
    // Only fetch doctors created by the authenticated user
    const doctors = await prisma.doctor.findMany({
      where: {
        createdById: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get a single doctor by ID (ownership verified)
 * GET /api/doctors/:id/
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID. Must be an integer.'
      });
    }

    // Query doctor matching both doctor ID and logged-in user ID
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        createdById: req.user.id
      }
    });

    // Return 404 if doctor doesn't exist or belongs to another user
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Update a doctor by ID (ownership verified)
 * PUT /api/doctors/:id/
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID. Must be an integer.'
      });
    }

    // Check if doctor exists and belongs to the logged-in user
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        createdById: req.user.id
      }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    const { name, specialization, email, phone } = req.body;

    // Validate email if updated
    let updatedEmail = existingDoctor.email;
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
      updatedEmail = trimmedEmail;
    }

    // Update doctor in PostgreSQL (ignoring any attempts to change id or createdById)
    const updatedDoctor = await prisma.doctor.update({
      where: {
        id: doctorId
      },
      data: {
        name: name !== undefined ? name.trim() : existingDoctor.name,
        specialization: specialization !== undefined ? specialization.trim() : existingDoctor.specialization,
        email: updatedEmail,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existingDoctor.phone
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully.',
      data: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete a doctor by ID (ownership verified)
 * DELETE /api/doctors/:id/
 */
export const deleteDoctor = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID. Must be an integer.'
      });
    }

    // Check if doctor exists and belongs to the logged-in user
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        createdById: req.user.id
      }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    // Delete doctor from PostgreSQL
    await prisma.doctor.delete({
      where: {
        id: doctorId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
