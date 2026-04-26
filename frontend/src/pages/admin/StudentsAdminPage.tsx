import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import AdminFormModal from '../../components/admin/AdminFormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import {
  createStudentAdmin,
  deleteStudentAdmin,
  listStudentsAdmin,
  updateStudentAdmin,
} from '../../features/admin/api/studentsAdminApi'
import type { StudentApiResponse, StudentApiUpsertPayload } from '../../features/admin/types/adminApiTypes'
import type { StudentAdminRow, StudentFormPayload } from '../../features/admin/types/adminContracts'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

const initialStudentForm: StudentFormPayload = {
  fullName: '',
  email: '',
  phone: '',
  rfidUid: '',
  sectionIds: [],
}

const toStudentRow = (student: StudentApiResponse): StudentAdminRow => ({
  id: student.id,
  fullName: student.full_name,
  email: student.email,
  rfidUid: student.rfid_uid,
  sectionCount: 0,
  attendanceRate: 0,
})

const toStudentPayload = (
  formState: StudentFormPayload,
): StudentApiUpsertPayload => ({
  full_name: formState.fullName.trim(),
  email: formState.email.trim(),
  phone: formState.phone.trim() || undefined,
  rfid_uid: formState.rfidUid.trim(),
})

export default function StudentsAdminPage() {
  const [rows, setRows] = useState<StudentAdminRow[]>([])
  const [studentsById, setStudentsById] = useState<Record<string, StudentApiResponse>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formState, setFormState] = useState<StudentFormPayload>(initialStudentForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentAdminRow | null>(null)

  const syncStudentIntoState = useCallback((student: StudentApiResponse) => {
    const nextRow = toStudentRow(student)

    setRows((currentRows) => {
      const existingIndex = currentRows.findIndex((row) => row.id === nextRow.id)
      if (existingIndex === -1) {
        return [nextRow, ...currentRows]
      }

      const updatedRows = [...currentRows]
      updatedRows[existingIndex] = nextRow
      return updatedRows
    })

    setStudentsById((current) => ({
      ...current,
      [student.id]: student,
    }))
  }, [])

  const removeStudentFromState = useCallback((studentId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== studentId))
    setStudentsById((current) => {
      const next = { ...current }
      delete next[studentId]
      return next
    })
  }, [])

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setFeedbackError(null)

    try {
      const students = await listStudentsAdmin()
      setRows(students.map(toStudentRow))
      setStudentsById(
        Object.fromEntries(students.map((student) => [student.id, student])),
      )
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load students.',
      )
      setRows([])
      setStudentsById({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStudents()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadStudents])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFormState(initialStudentForm)
    setIsFormOpen(true)
  }, [])

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Students',
      description: 'Manage student profiles, RFID identifiers, and section membership from one standardized admin workflow.',
      primaryActionLabel: 'Add Student',
      onPrimaryAction: openCreateModal,
      isPrimaryActionLoading: isSubmitting,
    }),
    [isSubmitting, openCreateModal],
  )

  useAdminPageConfig(pageConfig)

  const columns = useMemo<DataTableColumn<StudentAdminRow>[]>(
    () => [
      { id: 'fullName', header: 'Student', cell: (row) => row.fullName },
      { id: 'email', header: 'Email', cell: (row) => row.email },
      { id: 'rfidUid', header: 'RFID UID', cell: (row) => row.rfidUid },
      { id: 'sectionCount', header: 'Sections', align: 'center', cell: (row) => row.sectionCount },
      {
        id: 'attendanceRate',
        header: 'Attendance %',
        align: 'right',
        cell: (row) => `${row.attendanceRate.toFixed(1)}%`,
      },
    ],
    [],
  )

  const handleEdit = useCallback((row: StudentAdminRow) => {
    const sourceStudent = studentsById[row.id]

    setEditingId(row.id)
    setFormState({
      fullName: sourceStudent?.full_name ?? row.fullName,
      email: sourceStudent?.email ?? row.email,
      phone: sourceStudent?.phone ?? '',
      rfidUid: sourceStudent?.rfid_uid ?? row.rfidUid,
      sectionIds: [],
    })
    setIsFormOpen(true)
  }, [studentsById])

  const handleDelete = useCallback((row: StudentAdminRow) => {
    setSelectedStudent(row)
    setIsDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedbackError(null)

    try {
      const payload = toStudentPayload(formState)
      const savedStudent = editingId
        ? await updateStudentAdmin(editingId, payload)
        : await createStudentAdmin(payload)

      syncStudentIntoState(savedStudent)
      setIsFormOpen(false)
      setEditingId(null)
      setFormState(initialStudentForm)
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to save student.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [editingId, formState, syncStudentIntoState])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedStudent) {
      return
    }

    setIsDeleting(true)
    setFeedbackError(null)

    try {
      await deleteStudentAdmin(selectedStudent.id)
      removeStudentFromState(selectedStudent.id)
      setSelectedStudent(null)
      setIsDeleteOpen(false)
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to delete student.',
      )
    } finally {
      setIsDeleting(false)
    }
  }, [removeStudentFromState, selectedStudent])

  return (
    <div className="admin-page-stack">
      <section className="admin-page-note">
        <h3>Student records</h3>
        <p>Create, update, and remove student records while keeping identifiers and section assignments consistent.</p>
      </section>

      {feedbackError && (
        <section className="admin-page-alert" role="alert">
          <p>{feedbackError}</p>
          <button type="button" onClick={() => void loadStudents()}>
            Retry
          </button>
        </section>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
        emptyState={
          <EmptyState
            title="No students loaded"
            description="Create the first student or use retry if the API is temporarily unavailable."
            actionLabel="Add Student"
            onAction={openCreateModal}
          />
        }
      />

      <AdminFormModal
        isOpen={isFormOpen}
        title={editingId ? 'Update Student' : 'Create Student'}
        description="Capture the student profile details required for attendance and enrollment management."
        submitLabel={editingId ? 'Save Student' : 'Create Student'}
        isSubmitting={isSubmitting}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      >
        <div className="admin-form-grid">
          <label>
            Full Name
            <input
              value={formState.fullName}
              onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>

          <label>
            Phone
            <input
              value={formState.phone}
              onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>

          <label>
            RFID UID
            <input
              value={formState.rfidUid}
              onChange={(event) => setFormState((current) => ({ ...current, rfidUid: event.target.value }))}
            />
          </label>

          <label className="admin-field-span-2">
            Section IDs (comma separated)
            <input
              value={formState.sectionIds.join(', ')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  sectionIds: event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>
        </div>
      </AdminFormModal>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Student"
        message={`Delete ${selectedStudent?.fullName ?? 'this student'} from the student directory?`}
        confirmLabel="Delete Student"
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
