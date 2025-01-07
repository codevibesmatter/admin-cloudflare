import { useUsers, useUpdateUser, useDeleteUser } from '../api/users'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleServerError } from '@/utils/handle-server-error'
import { Button } from '@/components/ui/button'
import { SyncFromClerkButton } from './sync-from-clerk-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GetUsersResponse, User, UserUpdate } from '@admin-cloudflare/api-types'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  CellContext,
  createColumnHelper,
  sortingFns,
  TableMeta,
  Column,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { callTypes } from '../data/data'
import { ArrowUpDown, MoreHorizontal, Pencil, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { UserStatus } from '../data/schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQueryClient } from '@tanstack/react-query'
import { userKeys } from '../api/users'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from "@/lib/utils"

interface EditableCellProps {
  getValue: () => string
  row: any
  column: any
  table: any
  updateData: (rowIndex: number, columnId: string, value: string) => void
}

const HighlightMatch = ({ text, match }: { text: string, match: string }) => {
  if (!match.trim()) return <>{text}</>

  const regex = new RegExp(`(${match})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className="truncate">
      {parts.map((part, i) => (
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </span>
  )
}

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  updateData,
}: EditableCellProps) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  
  const globalFilter = table.getState().globalFilter ?? ""

  const onBlur = () => {
    setIsEditing(false)
    if (value !== initialValue) {
      updateData(row.index, column.id, value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onBlur()
    }
  }

  return (
    <div 
      className="relative flex items-center group w-[200px]"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-[180px]"
        />
      ) : (
        <div className="flex items-center gap-1 w-full cursor-pointer">
          <HighlightMatch text={value} match={globalFilter} />
        </div>
      )}
    </div>
  )
}

const EditableStatusCell = ({
  getValue,
  row,
  column,
  table,
  updateData,
}: EditableCellProps) => {
  const value = getValue()
  const [localValue, setLocalValue] = useState(value)
  const className = callTypes.get(localValue as UserStatus)

  const handleValueChange = (newValue: string) => {
    setLocalValue(newValue)
    updateData(row.index, column.id, newValue)
  }

  return (
    <div className="relative flex items-center group">
      <Select
        value={localValue}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue>
            <Badge variant="outline" className={className}>
              {localValue}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="invited">Invited</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

const EditableRoleCell = ({
  getValue,
  row,
  column,
  table,
  updateData,
}: EditableCellProps) => {
  const value = getValue()
  const [localValue, setLocalValue] = useState(value)

  const handleValueChange = (newValue: string) => {
    setLocalValue(newValue)
    updateData(row.index, column.id, newValue)
  }

  return (
    <div className="relative flex items-center group">
      <Select
        value={localValue}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue>
            <div className="capitalize">{localValue}</div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="superadmin">Superadmin</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="cashier">Cashier</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

const EmailCell = ({
  getValue,
  row,
  column,
  table,
  updateData,
}: EditableCellProps) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  
  const globalFilter = table.getState().globalFilter ?? ""

  const onBlur = () => {
    setIsEditing(false)
    if (value !== initialValue) {
      updateData(row.index, column.id, value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onBlur()
    }
  }

  return (
    <div 
      className="relative flex items-center group w-[300px]"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-[280px]"
        />
      ) : (
        <div className="flex items-center gap-1 w-full cursor-pointer">
          <HighlightMatch text={value} match={globalFilter} />
        </div>
      )}
    </div>
  )
}

const ActionCell = ({ row }: { row: any }) => {
  const user = row.original
  const deleteUser = useDeleteUser()
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.id)
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user',
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Add type for table meta
interface TableMetaType {
  updateData: (rowIndex: number, columnId: string, value: string) => void
}

// Create a column helper for better type safety
const columnHelper = createColumnHelper<User>()

const SortButton = ({ 
  column, 
  children 
}: { 
  column: Column<User, unknown>, 
  children: React.ReactNode 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const isSorted = column.getIsSorted()
  
  const handleSort = () => {
    setIsLoading(true)
    setTimeout(() => {
      column.toggleSorting(isSorted === "asc")
      setIsLoading(false)
    }, 0)
  }
  
  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className="gap-1"
    >
      {children}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <div className="flex flex-col">
          <ChevronUp 
            className={cn(
              "h-3 w-3 -mb-1",
              isSorted === "asc" ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            )} 
          />
          <ChevronDown 
            className={cn(
              "h-3 w-3 -mt-1",
              isSorted === "desc" ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            )} 
          />
        </div>
      )}
    </Button>
  )
}

// Define columns outside component for better performance
const columns = [
  columnHelper.accessor('firstName', {
    header: ({ column }) => (
      <div className="text-left">
        <SortButton column={column}>First Name</SortButton>
      </div>
    ),
    cell: (props) => (
      <div className="pl-4">
        <EditableCell 
          getValue={() => props.getValue()}
          row={props.row}
          column={props.column}
          table={props.table}
          updateData={(props.table.options.meta as TableMetaType).updateData}
        />
      </div>
    ),
    sortingFn: sortingFns.alphanumeric,
  }),
  columnHelper.accessor('lastName', {
    header: ({ column }) => (
      <div className="text-left">
        <SortButton column={column}>Last Name</SortButton>
      </div>
    ),
    cell: (props) => (
      <div className="pl-4">
        <EditableCell 
          getValue={() => props.getValue()}
          row={props.row}
          column={props.column}
          table={props.table}
          updateData={(props.table.options.meta as TableMetaType).updateData}
        />
      </div>
    ),
    sortingFn: sortingFns.alphanumeric,
  }),
  columnHelper.accessor('email', {
    header: ({ column }) => (
      <div className="text-left">
        <SortButton column={column}>Email</SortButton>
      </div>
    ),
    cell: (props) => (
      <div className="pl-4">
        <EmailCell 
          getValue={() => props.getValue()}
          row={props.row}
          column={props.column}
          table={props.table}
          updateData={(props.table.options.meta as TableMetaType).updateData}
        />
      </div>
    ),
    sortingFn: sortingFns.text,
  }),
  columnHelper.accessor('role', {
    header: ({ column }) => (
      <div className="text-left">
        <SortButton column={column}>Role</SortButton>
      </div>
    ),
    cell: (props) => (
      <div className="pl-4">
        <EditableRoleCell 
          getValue={() => props.getValue()}
          row={props.row}
          column={props.column}
          table={props.table}
          updateData={(props.table.options.meta as TableMetaType).updateData}
        />
      </div>
    ),
    sortingFn: sortingFns.text,
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => (
      <div className="text-left">
        <SortButton column={column}>Status</SortButton>
      </div>
    ),
    cell: (props) => (
      <div className="pl-4">
        <EditableStatusCell 
          getValue={() => props.getValue()}
          row={props.row}
          column={props.column}
          table={props.table}
          updateData={(props.table.options.meta as TableMetaType).updateData}
        />
      </div>
    ),
    sortingFn: sortingFns.text,
  }),
  columnHelper.accessor('clerkId', {
    header: () => <div className="text-left pl-4">Clerk ID</div>,
    cell: ({ row }) => (
      <div className="pl-4">
        {row.original.clerkId || 'Not synced'}
      </div>
    ),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <div className="text-right pr-4">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right pr-4">
        <ActionCell row={row} />
      </div>
    ),
    enableSorting: false,
  }),
]

const fuzzyFilter = (row: any, columnId: string, filterValue: string) => {
  const value = row.getValue(columnId) as string
  return value.toLowerCase().includes(filterValue.toLowerCase())
}

export function UsersTable() {
  const { toast } = useToast()
  const { data, error, isLoading } = useUsers()
  const updateUser = useUpdateUser()
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [inputValue, setInputValue] = useState("")
  const [globalFilter, setGlobalFilter] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Debounced filter function
  const debouncedFilter = useDebouncedCallback((value: string) => {
    setGlobalFilter(value)
    setIsSearching(false)
  }, 400)

  // Handle input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value) // Update input immediately
    setIsSearching(true) // Show loading state
    debouncedFilter(value) // Debounce the actual filtering
  }

  useEffect(() => {
    if (error) {
      console.error('Users table error:', error)
      toast({
        variant: 'destructive',
        title: handleServerError(error),
      })
    }
  }, [error, toast])

  const updateData = async (rowIndex: number, columnId: string, value: string) => {
    try {
      const user = data?.data.users[rowIndex]
      if (!user) return

      const updateData: UserUpdate = {
        [columnId]: value
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Updating user:', {
          userId: user.id,
          field: columnId,
          oldValue: user[columnId as keyof User],
          newValue: value,
          timestamp: new Date().toISOString()
        })
      }

      // Optimistically update the UI
      queryClient.setQueryData<GetUsersResponse>(
        userKeys.lists(),
        (old) => {
          if (!old) return old
          const newUsers = old.data.users.map((u) =>
            u.id === user.id ? { ...u, [columnId]: value } : u
          )
          return {
            ...old,
            data: { ...old.data, users: newUsers },
          }
        }
      )

      await updateUser.mutateAsync({
        id: user.id,
        data: updateData
      }, {
        onError: (error) => {
          // Revert optimistic update on error
          queryClient.setQueryData<GetUsersResponse>(
            userKeys.lists(),
            (old) => {
              if (!old) return old
              const revertedUsers = old.data.users.map((u) =>
                u.id === user.id ? { ...u, [columnId]: user[columnId as keyof User] } : u
              )
              return {
                ...old,
                data: { ...old.data, users: revertedUsers },
              }
            }
          )

          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to update user:', {
              userId: user.id,
              field: columnId,
              attemptedValue: value,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })
          }

          toast({
            variant: 'destructive',
            title: 'Failed to update user',
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          })
        },
        onSuccess: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Successfully updated user:', {
              userId: user.id,
              field: columnId,
              newValue: value,
              timestamp: new Date().toISOString()
            })
          }

      toast({
            title: 'Success',
            description: 'User updated successfully',
          })
        }
      })
    } catch (e) {
      console.error('Error in update handler:', e)
      toast({
        variant: 'destructive',
        title: 'Failed to update user',
        description: e instanceof Error ? e.message : 'Unknown error occurred',
      })
    }
  }

  const table = useReactTable<User>({
    data: data?.data.users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter,
    },
    meta: {
      updateData,
    } as TableMetaType,
    enableMultiSort: true,
    sortDescFirst: false,
    globalFilterFn: fuzzyFilter,
    enableGlobalFilter: true,
    getColumnCanGlobalFilter: (column) => {
      return ['firstName', 'lastName', 'email'].includes(column.id)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between py-4">
        <div className="relative max-w-sm">
          <Input
            placeholder="Search all columns..."
            value={inputValue}
            onChange={handleSearchChange}
            className="pr-8"
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <SyncFromClerkButton />
      </div>
      {error && (
        <pre className="p-4 bg-destructive/10 text-destructive rounded-md">
          Error: {error.message}
        </pre>
      )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </div>
    </div>
  )
}

