'use server'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { studies } from '#/db/schema'
import type {
  CreateStudyInput,
  Study,
  UpdateStudyInput,
  ValidationError,
} from '#/types/domain'
import { validateCreateStudy, validateUpdateStudy } from './validation'

export const getStudies = createServerFn().handler(
  async (): Promise<Study[]> => {
    const rows = await db
      .select()
      .from(studies)
      .orderBy(desc(studies.createdAt))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      taskLabel: r.taskLabel,
      description: r.description ?? null,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  },
)

export const createStudy = createServerFn()
  .inputValidator((d: CreateStudyInput) => d)
  .handler(async ({ data }): Promise<Study | ValidationError[]> => {
    const errors = validateCreateStudy(data)
    if (errors.length > 0) return errors

    const [row] = await db
      .insert(studies)
      .values({
        name: data.name.trim(),
        taskLabel: data.taskLabel.trim(),
        description: data.description?.trim() ?? null,
        createdBy: data.createdBy.trim(),
      })
      .returning()

    return {
      id: row.id,
      name: row.name,
      taskLabel: row.taskLabel,
      description: row.description ?? null,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

export const getStudyById = createServerFn()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<Study | null> => {
    const [row] = await db
      .select()
      .from(studies)
      .where(eq(studies.id, data.id))
      .limit(1)

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      taskLabel: row.taskLabel,
      description: row.description ?? null,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

export const updateStudy = createServerFn()
  .inputValidator((d: { id: string; input: UpdateStudyInput }) => d)
  .handler(async ({ data }): Promise<Study | ValidationError[]> => {
    const errors = validateUpdateStudy(data.input)
    if (errors.length > 0) return errors

    const updates: Partial<typeof studies.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (data.input.name !== undefined) updates.name = data.input.name.trim()
    if (data.input.taskLabel !== undefined)
      updates.taskLabel = data.input.taskLabel.trim()
    if (data.input.description !== undefined)
      updates.description = data.input.description.trim()

    const [row] = await db
      .update(studies)
      .set(updates)
      .where(eq(studies.id, data.id))
      .returning()

    return {
      id: row.id,
      name: row.name,
      taskLabel: row.taskLabel,
      description: row.description ?? null,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

export const deleteStudy = createServerFn()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await db.delete(studies).where(eq(studies.id, data.id))
    return { success: true }
  })
