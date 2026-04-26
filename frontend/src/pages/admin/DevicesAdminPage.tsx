import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import AdminFormModal from '../../components/admin/AdminFormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import {
  createDeviceAdmin,
  deleteDeviceAdmin,
  listDevicesAdmin,
  updateDeviceAdmin,
} from '../../features/admin/api/devicesAdminApi'
import type { DeviceApiResponse, DeviceApiUpsertPayload } from '../../features/admin/types/adminApiTypes'
import type { DeviceAdminRow, DeviceFormPayload, PresenceMethod } from '../../features/admin/types/adminContracts'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

const initialDeviceForm: DeviceFormPayload = {
  deviceName: '',
  location: '',
  supportedMethods: ['RFID'],
  isActive: true,
}

const normalizeMethods = (value: string): PresenceMethod[] => {
  const methods = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is PresenceMethod => item === 'RFID' || item === 'FACE' || item === 'MANUAL')

  return methods.length > 0 ? methods : ['RFID']
}

const toDeviceRow = (device: DeviceApiResponse): DeviceAdminRow => ({
  id: device.id,
  deviceName: device.device_name,
  location: device.location ?? 'Not set',
  supportedMethods: ['RFID'],
  isActive: true,
})

const toDevicePayload = (
  formState: DeviceFormPayload,
): DeviceApiUpsertPayload => ({
  device_name: formState.deviceName.trim(),
  location: formState.location.trim() || undefined,
})

export default function DevicesAdminPage() {
  const [rows, setRows] = useState<DeviceAdminRow[]>([])
  const [devicesById, setDevicesById] = useState<Record<string, DeviceApiResponse>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<DeviceFormPayload>(initialDeviceForm)
  const [selectedDevice, setSelectedDevice] = useState<DeviceAdminRow | null>(null)

  const syncDeviceIntoState = useCallback((device: DeviceApiResponse) => {
    const nextRow = toDeviceRow(device)

    setRows((currentRows) => {
      const existingIndex = currentRows.findIndex((row) => row.id === nextRow.id)

      if (existingIndex === -1) {
        return [nextRow, ...currentRows]
      }

      const updatedRows = [...currentRows]
      updatedRows[existingIndex] = nextRow
      return updatedRows
    })

    setDevicesById((current) => ({
      ...current,
      [device.id]: device,
    }))
  }, [])

  const removeDeviceFromState = useCallback((deviceId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== deviceId))
    setDevicesById((current) => {
      const next = { ...current }
      delete next[deviceId]
      return next
    })
  }, [])

  const loadDevices = useCallback(async () => {
    setIsLoading(true)
    setFeedbackError(null)

    try {
      const devices = await listDevicesAdmin()
      setRows(devices.map(toDeviceRow))
      setDevicesById(
        Object.fromEntries(devices.map((device) => [device.id, device])),
      )
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load devices.',
      )
      setRows([])
      setDevicesById({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDevices()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDevices])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFormState(initialDeviceForm)
    setIsFormOpen(true)
  }, [])

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Devices',
      description: 'Manage attendance devices, deployment locations, and availability from the same admin design system.',
      primaryActionLabel: 'Add Device',
      onPrimaryAction: openCreateModal,
      isPrimaryActionLoading: isSubmitting,
    }),
    [isSubmitting, openCreateModal],
  )

  useAdminPageConfig(pageConfig)

  const columns = useMemo<DataTableColumn<DeviceAdminRow>[]>(
    () => [
      { id: 'deviceName', header: 'Device', cell: (row) => row.deviceName },
      { id: 'location', header: 'Location', cell: (row) => row.location },
      {
        id: 'supportedMethods',
        header: 'Methods',
        cell: (row) => row.supportedMethods.join(', '),
      },
      {
        id: 'status',
        header: 'Status',
        align: 'right',
        cell: (row) => (
          <span
            className={`admin-status-pill ${
              row.isActive ? 'admin-status-pill-active' : 'admin-status-pill-inactive'
            }`}
          >
            {row.isActive ? 'active' : 'inactive'}
          </span>
        ),
      },
    ],
    [],
  )

  const handleEdit = useCallback((row: DeviceAdminRow) => {
    const sourceDevice = devicesById[row.id]

    setEditingId(row.id)
    setFormState({
      deviceName: sourceDevice?.device_name ?? row.deviceName,
      location: sourceDevice?.location ?? '',
      supportedMethods: row.supportedMethods,
      isActive: row.isActive,
    })
    setIsFormOpen(true)
  }, [devicesById])

  const handleDelete = useCallback((row: DeviceAdminRow) => {
    setSelectedDevice(row)
    setIsDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedbackError(null)

    try {
      const payload = toDevicePayload(formState)
      const savedDevice = editingId
        ? await updateDeviceAdmin(editingId, payload)
        : await createDeviceAdmin(payload)

      syncDeviceIntoState(savedDevice)
      setIsFormOpen(false)
      setEditingId(null)
      setFormState(initialDeviceForm)
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to save device.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [editingId, formState, syncDeviceIntoState])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDevice) {
      return
    }

    setIsDeleting(true)
    setFeedbackError(null)

    try {
      await deleteDeviceAdmin(selectedDevice.id)
      removeDeviceFromState(selectedDevice.id)
      setSelectedDevice(null)
      setIsDeleteOpen(false)
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to delete device.',
      )
    } finally {
      setIsDeleting(false)
    }
  }, [removeDeviceFromState, selectedDevice])

  return (
    <div className="admin-page-stack">
      <section className="admin-page-note">
        <h3>Device inventory</h3>
        <p>Track device names, deployment locations, and operating status for the attendance network.</p>
      </section>

      {feedbackError && (
        <section className="admin-page-alert" role="alert">
          <p>{feedbackError}</p>
          <button type="button" onClick={() => void loadDevices()}>
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
            title="No devices loaded"
            description="Create the first device or use retry if the API is temporarily unavailable."
            actionLabel="Add Device"
            onAction={openCreateModal}
          />
        }
      />

      <AdminFormModal
        isOpen={isFormOpen}
        title={editingId ? 'Update Device' : 'Create Device'}
        description="Maintain the device details used to identify active attendance hardware across locations."
        submitLabel={editingId ? 'Save Device' : 'Create Device'}
        isSubmitting={isSubmitting}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      >
        <div className="admin-form-grid">
          <label>
            Device Name
            <input
              value={formState.deviceName}
              onChange={(event) => setFormState((current) => ({ ...current, deviceName: event.target.value }))}
              required
            />
          </label>

          <label>
            Location
            <input
              value={formState.location}
              onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
              required
            />
          </label>

          <label className="admin-field-span-2">
            Supported Methods (RFID, FACE, MANUAL)
            <input
              value={formState.supportedMethods.join(', ')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  supportedMethods: normalizeMethods(event.target.value),
                }))
              }
            />
          </label>

          <label className="admin-field-span-2">
            Status
            <select
              value={formState.isActive ? 'active' : 'inactive'}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.value === 'active',
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </AdminFormModal>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Device"
        message={`Delete ${selectedDevice?.deviceName ?? 'this device'} from the device inventory?`}
        confirmLabel="Delete Device"
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
