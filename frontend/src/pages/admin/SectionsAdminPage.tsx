import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import AdminFormModal from '../../components/admin/AdminFormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import TableToolbar from '../../components/admin/TableToolbar'
import FeedbackBanner from '../../components/ui/FeedbackBanner'
import { listCoursesAdmin } from '../../features/admin/api/coursesAdminApi'
import {
  createSectionAdmin,
  deleteSectionAdmin,
  listSectionsAdmin,
  updateSectionAdmin,
} from '../../features/admin/api/sectionsAdminApi'
import { listUsersAdmin } from '../../features/admin/api/usersAdminApi'
import type {
  CourseApiResponse,
  SectionApiResponse,
  SectionApiUpsertPayload,
  UserApiResponse,
} from '../../features/admin/types/adminApiTypes'
import type { SectionAdminRow, SectionFormPayload } from '../../features/admin/types/adminContracts'
import { useSnackbar } from '../../hooks/useSnackbar'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

const initialSectionForm: SectionFormPayload = {
  sectionName: '',
  courseId: '',
  instructorId: '',
  scheduleTime: '',
}

const toDateTimeLocalValue = (iso: string): string => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number): string => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const toIsoString = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString()
}

const formatSchedule = (iso: string): string => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString()
}

const toSectionPayload = (
  formState: SectionFormPayload,
): SectionApiUpsertPayload => ({
  section_name: formState.sectionName.trim(),
  course_id: formState.courseId.trim(),
  instructor_id: formState.instructorId.trim(),
  schedule_time: toIsoString(formState.scheduleTime.trim()),
})

const toSectionRow = (
  section: SectionApiResponse,
  courseMap: Record<string, CourseApiResponse>,
  userMap: Record<string, UserApiResponse>,
): SectionAdminRow => ({
  id: section.id,
  sectionName: section.section_name,
  courseCode:
    courseMap[section.course_id]?.course_code ??
    section.course_id.slice(0, 8),
  instructorName:
    userMap[section.instructor_id]?.full_name ??
    section.instructor_id.slice(0, 8),
  scheduleTime: formatSchedule(section.schedule_time),
  enrolledCount: 0,
})

export default function SectionsAdminPage() {
  const [rows, setRows] = useState<SectionAdminRow[]>([])
  const [sectionById, setSectionById] = useState<Record<string, SectionApiResponse>>({})
  const [courseById, setCourseById] = useState<Record<string, CourseApiResponse>>({})
  const [userById, setUserById] = useState<Record<string, UserApiResponse>>({})
  const [courseOptions, setCourseOptions] = useState<CourseApiResponse[]>([])
  const [instructorOptions, setInstructorOptions] = useState<UserApiResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<SectionFormPayload>(initialSectionForm)
  const [selectedSection, setSelectedSection] = useState<SectionAdminRow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { showSnackbar } = useSnackbar()

  const syncSectionIntoState = useCallback(
    (section: SectionApiResponse) => {
      const nextRow = toSectionRow(section, courseById, userById)

      setRows((currentRows) => {
        const existingIndex = currentRows.findIndex((row) => row.id === nextRow.id)

        if (existingIndex === -1) {
          return [nextRow, ...currentRows]
        }

        const updatedRows = [...currentRows]
        updatedRows[existingIndex] = nextRow
        return updatedRows
      })

      setSectionById((current) => ({
        ...current,
        [section.id]: section,
      }))
    },
    [courseById, userById],
  )

  const removeSectionFromState = useCallback((sectionId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== sectionId))
    setSectionById((current) => {
      const next = { ...current }
      delete next[sectionId]
      return next
    })
  }, [])

  const loadSections = useCallback(async () => {
    setIsLoading(true)
    setFeedbackError(null)

    try {
      const [sections, courses] = await Promise.all([
        listSectionsAdmin(),
        listCoursesAdmin(),
      ])

      let users: UserApiResponse[] = []

      try {
        users = await listUsersAdmin()
      } catch {
        users = []
      }

      const nextCourseById = Object.fromEntries(
        courses.map((course) => [course.id, course]),
      )
      const nextUserById = Object.fromEntries(users.map((user) => [user.id, user]))

      setCourseById(nextCourseById)
      setUserById(nextUserById)
      setCourseOptions(courses)
      setInstructorOptions(users.filter((user) => user.role === 'instructor'))
      setSectionById(
        Object.fromEntries(sections.map((section) => [section.id, section])),
      )
      setRows(
        sections.map((section) => toSectionRow(section, nextCourseById, nextUserById)),
      )
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load sections.',
      )
      setRows([])
      setSectionById({})
      setCourseById({})
      setUserById({})
      setCourseOptions([])
      setInstructorOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSections()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadSections])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFormState(initialSectionForm)
    setFormError(null)
    setIsFormOpen(true)
  }, [])

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Sections',
      description: 'Manage section scheduling, course mapping, and instructor assignments within one workflow.',
      primaryActionLabel: 'Add Section',
      onPrimaryAction: openCreateModal,
      isPrimaryActionLoading: isSubmitting,
    }),
    [isSubmitting, openCreateModal],
  )

  useAdminPageConfig(pageConfig)

  const columns = useMemo<DataTableColumn<SectionAdminRow>[]>(
    () => [
      { id: 'sectionName', header: 'Section', cell: (row) => row.sectionName },
      { id: 'courseCode', header: 'Course', cell: (row) => row.courseCode },
      { id: 'instructorName', header: 'Instructor', cell: (row) => row.instructorName },
      { id: 'scheduleTime', header: 'Schedule', cell: (row) => row.scheduleTime },
      { id: 'enrolledCount', header: 'Students', align: 'right', cell: (row) => row.enrolledCount },
    ],
    [],
  )

  const handleEdit = useCallback((row: SectionAdminRow) => {
    const sourceSection = sectionById[row.id]

    setEditingId(row.id)
    setFormState({
      sectionName: sourceSection?.section_name ?? row.sectionName,
      courseId: sourceSection?.course_id ?? '',
      instructorId: sourceSection?.instructor_id ?? '',
      scheduleTime: sourceSection
        ? toDateTimeLocalValue(sourceSection.schedule_time)
        : '',
    })
    setFormError(null)
    setIsFormOpen(true)
  }, [sectionById])

  const handleDelete = useCallback((row: SectionAdminRow) => {
    setSelectedSection(row)
    setIsDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      const payload = toSectionPayload(formState)
      const savedSection = editingId
        ? await updateSectionAdmin(editingId, payload)
        : await createSectionAdmin(payload)

      syncSectionIntoState(savedSection)
      setIsFormOpen(false)
      setEditingId(null)
      setFormState(initialSectionForm)
      showSnackbar(editingId ? 'Section updated successfully.' : 'Section created successfully.', 'success')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to save section.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [editingId, formState, syncSectionIntoState, showSnackbar])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedSection) {
      return
    }

    setIsDeleting(true)
    setFormError(null)

    try {
      await deleteSectionAdmin(selectedSection.id)
      removeSectionFromState(selectedSection.id)
      setSelectedSection(null)
      setIsDeleteOpen(false)
      showSnackbar('Section deleted successfully.', 'success')
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to delete section.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }, [removeSectionFromState, selectedSection, showSnackbar])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter(row => 
      row.sectionName.toLowerCase().includes(query) || 
      row.courseCode.toLowerCase().includes(query) ||
      row.instructorName.toLowerCase().includes(query)
    )
  }, [rows, searchQuery])

  return (
    <div className="admin-page-stack">
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sections by name, course code, or instructor..."
      />

      {feedbackError && (
        <FeedbackBanner 
          variant="error" 
          title="Data loading failed" 
          description={feedbackError} 
          actionLabel="Retry" 
          onAction={() => void loadSections()} 
        />
      )}

      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
        emptyState={
          <FeedbackBanner
            variant="empty"
            title={searchQuery ? 'No sections found' : 'No sections loaded'}
            description={searchQuery ? 'Try adjusting your search criteria.' : 'Create the first section to get started.'}
            actionLabel={searchQuery ? undefined : 'Add Section'}
            onAction={searchQuery ? undefined : openCreateModal}
          />
        }
      />

      <AdminFormModal
        isOpen={isFormOpen}
        title={editingId ? 'Update Section' : 'Create Section'}
        description="Define the schedule and ownership details used throughout attendance operations."
        submitLabel={editingId ? 'Save Section' : 'Create Section'}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      >
        <div className="admin-form-grid">
          <div className="ui-field">
            <label className="ui-field__label">Section Name</label>
            <input
              className="ui-input"
              value={formState.sectionName}
              onChange={(event) => setFormState((current) => ({ ...current, sectionName: event.target.value }))}
              placeholder="e.g. Morning Batch A"
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Schedule Time</label>
            <input
              className="ui-input"
              type="datetime-local"
              value={formState.scheduleTime}
              onChange={(event) => setFormState((current) => ({ ...current, scheduleTime: event.target.value }))}
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Course</label>
            <select
              className="ui-select"
              value={formState.courseId}
              onChange={(event) => setFormState((current) => ({ ...current, courseId: event.target.value }))}
              required
            >
              <option value="">Select a course</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Instructor</label>
            <select
              className="ui-select"
              value={formState.instructorId}
              onChange={(event) => setFormState((current) => ({ ...current, instructorId: event.target.value }))}
              required
            >
              <option value="">Select an instructor</option>
              {instructorOptions.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminFormModal>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Section"
        message={`Delete ${selectedSection?.sectionName ?? 'this section'} from the section roster?`}
        confirmLabel="Delete Section"
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
