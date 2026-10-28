import prisma from '../config/db.js';

/**
 * 1. Assign a doctor to a patient
 * POST /api/mappings/
 */
export const createMapping = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;

    // Validate presence of required IDs
    if (patientId === undefined || doctorId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both patientId and doctorId are required.'
      });
    }

    const parsedPatientId = parseInt(patientId, 10);
    const parsedDoctorId = parseInt(doctorId, 10);

    // Validate ID formats
    if (isNaN(parsedPatientId) || isNaN(parsedDoctorId)) {
      return res.status(400).json({
        success: false,
        message: 'patientId and doctorId must be integers.'
      });
    }

    // 1. Verify patient exists and belongs to the authenticated user
    const patient = await prisma.patient.findFirst({
      where: {
        id: parsedPatientId,
        createdById: req.user.id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or you do not have permission to access this patient.'
      });
    }

    // 2. Verify doctor exists and belongs to the authenticated user
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: parsedDoctorId,
        createdById: req.user.id
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or you do not have permission to access this doctor.'
      });
    }

    // 3. Check for existing assignment before inserting
    const existingMapping = await prisma.patientDoctor.findUnique({
      where: {
        patientId_doctorId: {
          patientId: parsedPatientId,
          doctorId: parsedDoctorId
        }
      }
    });

    if (existingMapping) {
      return res.status(409).json({
        success: false,
        message: 'This doctor is already assigned to this patient.'
      });
    }

    // 4. Create assignment in PostgreSQL with Prisma 'include' for rich response
    const newMapping = await prisma.patientDoctor.create({
      data: {
        patientId: parsedPatientId,
        doctorId: parsedDoctorId,
        createdById: req.user.id
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor assigned to patient successfully.',
      data: newMapping
    });
  } catch (error) {
    // Handle Prisma unique constraint violation code P2002 as a fallback
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This doctor is already assigned to this patient.'
      });
    }
    next(error);
  }
};

/**
 * 2. Retrieve all mappings created by the logged-in user
 * GET /api/mappings/
 */
export const getMappings = async (req, res, next) => {
  try {
    const mappings = await prisma.patientDoctor.findMany({
      where: {
        createdById: req.user.id
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      count: mappings.length,
      data: mappings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Retrieve all doctors assigned to a specific patient
 * GET /api/mappings/:patient_id/
 */
export const getDoctorsByPatient = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.patient_id, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID. Must be an integer.'
      });
    }

    // 1. Verify patient exists and belongs to the authenticated user
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdById: req.user.id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or you do not have permission to access this patient.'
      });
    }

    // 2. Fetch all doctor mappings for this patient
    const mappings = await prisma.patientDoctor.findMany({
      where: {
        patientId: patientId,
        createdById: req.user.id
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender
      },
      count: mappings.length,
      doctors: mappings.map(m => ({
        mappingId: m.id,
        assignedAt: m.createdAt,
        ...m.doctor
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Remove a patient-doctor assignment
 * DELETE /api/mappings/:id/
 */
export const deleteMapping = async (req, res, next) => {
  try {
    const mappingId = parseInt(req.params.id, 10);

    if (isNaN(mappingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mapping ID. Must be an integer.'
      });
    }

    // Check if mapping exists and was created by the logged-in user
    const existingMapping = await prisma.patientDoctor.findFirst({
      where: {
        id: mappingId,
        createdById: req.user.id
      }
    });

    if (!existingMapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping not found.'
      });
    }

    // Delete mapping record
    await prisma.patientDoctor.delete({
      where: {
        id: mappingId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor assignment removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
