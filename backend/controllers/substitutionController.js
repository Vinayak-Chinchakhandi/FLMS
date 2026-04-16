import { getSubstitutionsByFaculty, getSubstitutionById, updateSubstitutionStatus } from '../utils/dataLayer.js';

export const getSubstitutionsForFaculty = async (req, res) => {
  try {
    const facultyId = Number(req.params.facultyId);
    if (!req.user || req.user.id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const substitutions = await getSubstitutionsByFaculty(facultyId);
    return res.json({ success: true, data: substitutions });
  } catch (err) {
    console.error('[getSubstitutionsForFaculty]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSubstitution = async (req, res) => {
  try {
    const substitutionId = Number(req.params.id);
    const { status } = req.body;

    if (!['accepted', 'assigned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be assigned or accepted' });
    }

    const existing = await getSubstitutionById(substitutionId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Substitution not found' });
    }
    if (existing.substitute_faculty_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await updateSubstitutionStatus(substitutionId, status);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[updateSubstitution]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
