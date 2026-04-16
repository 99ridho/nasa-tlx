import type { ValidationError } from '#/types/domain'

export function validateCreateStudy(input: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const data = input as Record<string, unknown>

  if (
    !data.name ||
    typeof data.name !== 'string' ||
    data.name.trim().length === 0
  ) {
    errors.push({
      type: 'validation',
      field: 'name',
      message: 'Name is required',
    })
  }
  if (
    !data.taskLabel ||
    typeof data.taskLabel !== 'string' ||
    data.taskLabel.trim().length === 0
  ) {
    errors.push({
      type: 'validation',
      field: 'taskLabel',
      message: 'Task label is required',
    })
  }
  if (
    !data.createdBy ||
    typeof data.createdBy !== 'string' ||
    data.createdBy.trim().length === 0
  ) {
    errors.push({
      type: 'validation',
      field: 'createdBy',
      message: 'Creator name is required',
    })
  }

  return errors
}

export function validateUpdateStudy(input: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const data = input as Record<string, unknown>

  if (
    data.name !== undefined &&
    (typeof data.name !== 'string' || data.name.trim().length === 0)
  ) {
    errors.push({
      type: 'validation',
      field: 'name',
      message: 'Name must be non-empty if provided',
    })
  }
  if (
    data.taskLabel !== undefined &&
    (typeof data.taskLabel !== 'string' || data.taskLabel.trim().length === 0)
  ) {
    errors.push({
      type: 'validation',
      field: 'taskLabel',
      message: 'Task label must be non-empty if provided',
    })
  }

  return errors
}

export function validateAddParticipant(input: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const data = input as Record<string, unknown>

  if (!data.studyId || typeof data.studyId !== 'string') {
    errors.push({
      type: 'validation',
      field: 'studyId',
      message: 'Study ID is required and must be a UUID',
    })
  }
  if (
    !data.participantCode ||
    typeof data.participantCode !== 'string' ||
    data.participantCode.trim().length === 0
  ) {
    errors.push({
      type: 'validation',
      field: 'participantCode',
      message: 'Participant code is required',
    })
  }

  return errors
}
