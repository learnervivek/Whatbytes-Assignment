import prisma from '../config/db.js';

/**
 * 1. Create a new patient
 * POST /api/patients/
 */
export const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, address } = req.body;

    // Validate required fields
    if (!name || age === undefined || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and gender are required fields.'
      });
    }

    // Validate age is a positive integer
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a positive integer.'
      });
    }

    // Create patient in PostgreSQL with createdById set strictly to authenticated user ID
    const newPatient = await prisma.patient.create({
      data: {
        name: name.trim(),
        age: parsedAge,
        gender: gender.trim(),
        address: address ? address.trim() : null,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Patient created successfully.',
      data: newPatient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. List all patients created by the logged-in user
 * GET /api/patients/
 */
export const getPatients = async (req, res, next) => {
  try {
    // Only fetch patients where createdById equals authenticated user's ID
    const patients = await prisma.patient.findMany({
      where: {
        createdById: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get a single patient by ID (ownership verified)
 * GET /api/patients/:id/
 */
export const getPatientById = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    // Validate ID is a number
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID. Must be an integer.'
      });
    }

    // Query patient matching both patient ID and logged-in user ID
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdById: req.user.id
      }
    });

    // Return 404 if patient doesn't exist or belongs to another user
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Update a patient by ID (ownership verified)
 * PUT /api/patients/:id/
 */
export const updatePatient = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID. Must be an integer.'
      });
    }

    // Check if patient exists and belongs to the logged-in user
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdById: req.user.id
      }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    const { name, age, gender, address } = req.body;

    // Validate age if provided
    let parsedAge = existingPatient.age;
    if (age !== undefined) {
      parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Age must be a positive integer.'
        });
      }
    }

    // Update patient (ignoring any attempts to modify createdById or id)
    const updatedPatient = await prisma.patient.update({
      where: {
        id: patientId
      },
      data: {
        name: name !== undefined ? name.trim() : existingPatient.name,
        age: parsedAge,
        gender: gender !== undefined ? gender.trim() : existingPatient.gender,
        address: address !== undefined ? (address ? address.trim() : null) : existingPatient.address
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient updated successfully.',
      data: updatedPatient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete a patient by ID (ownership verified)
 * DELETE /api/patients/:id/
 */
export const deletePatient = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID. Must be an integer.'
      });
    }

    // Check if patient exists and belongs to the logged-in user
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdById: req.user.id
      }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    // Delete patient from PostgreSQL
    await prisma.patient.delete({
      where: {
        id: patientId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
