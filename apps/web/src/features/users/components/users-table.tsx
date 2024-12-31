import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, MoreHorizontal } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { useState, useEffect, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { useUsers, useDeleteUser, useUpdateUser, userKeys } from '../api/users'
import { User, userRoleSchema, userStatusSchema } from '../data/schema'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

// Create an editable cell component
interface EditableCellProps {
  getValue: () => any
  row: any
  column: any
  table: any
  refetch: () => void
}

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  refetch,
}: EditableCellProps) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const updateUser = useUpdateUser()
  const queryClient = useQueryClient()

  const onBlur = () => {
    setIsEditing(false)
    if (value === initialValue) return

    const fieldName = column.id
    const previousValue = initialValue

    // Capitalize first letter if this is a firstName field
    const processedValue = fieldName === 'firstName' 
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : value

    updateUser.mutate(
      {
        id: row.original.id,
        data: { [fieldName]: processedValue },
      },
      {
        onError: () => {
          setValue(previousValue)
          toast({
            title: 'Error',
            description: 'Failed to update user',
            variant: 'destructive',
          })
        },
        onSuccess: async () => {
          // First invalidate the query
          await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
          
          // Check if we're editing the currently sorted column
          const currentSort = table.getState().sorting[0]
          if (currentSort && currentSort.id === column.id) {
            // Wait for a brief moment to ensure the backend has processed the update
            await new Promise(resolve => setTimeout(resolve, 100))
            // Force a complete refetch with current sorting
            await queryClient.resetQueries({ queryKey: userKeys.lists() })
          }
          
          refetch()
        }
      }
    )
  }

  if (!isEditing) {
    return (
      <div
        className={cn('group relative h-9 flex items-center')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn('w-[200px] relative')}>
          <div className={cn('flex items-center gap-1.5')}>
            <span className={cn('truncate')}>{value}</span>
            {isHovered && (
              <Button
                variant='ghost'
                size='icon'
                className={cn('h-6 w-6 p-0 opacity-70 hover:opacity-100')}
                onClick={() => setIsEditing(true)}
              >
                <Pencil className={cn('h-3 w-3')} />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-[200px] h-9 flex items-center')}>
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onBlur()
          }
          if (e.key === 'Escape') {
            setIsEditing(false)
            setValue(initialValue)
          }
        }}
        autoFocus
        className={cn('h-8')}
      />
    </div>
  )
}

// Create a select cell component for role and status
interface SelectCellProps {
  getValue: () => any
  row: any
  column: any
  options: string[]
  table: any
  refetch: () => void
}

const SelectCell = ({
  getValue,
  row,
  column,
  options,
  table,
  refetch,
}: SelectCellProps) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const updateUser = useUpdateUser()
  const queryClient = useQueryClient()

  const onValueChange = (newValue: string) => {
    setValue(newValue)
    setIsEditing(false)

    const fieldName = column.id
    const previousValue = value

    updateUser.mutate(
      {
        id: row.original.id,
        data: { [fieldName]: newValue },
      },
      {
        onError: () => {
          setValue(previousValue)
          toast({
            title: 'Error',
            description: 'Failed to update user',
            variant: 'destructive',
          })
        },
        onSuccess: async () => {
          // First invalidate the query
          await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
          
          // Check if we're editing the currently sorted column
          const currentSort = table.getState().sorting[0]
          if (currentSort && currentSort.id === column.id) {
            // Wait for a brief moment to ensure the backend has processed the update
            await new Promise(resolve => setTimeout(resolve, 100))
            // Force a complete refetch with current sorting
            await queryClient.resetQueries({ queryKey: userKeys.lists() })
          }
          
          refetch()
        }
      }
    )
  }

  const getBadgeVariant = (value: string, type: 'role' | 'status') => {
    if (type === 'status') {
      switch (value) {
        case 'active':
          return 'success'
        case 'inactive':
          return 'secondary'
        case 'suspended':
          return 'destructive'
        case 'invited':
          return 'warning'
        default:
          return 'secondary'
      }
    }
    return 'outline'
  }

  if (!isEditing) {
    return (
      <div
        className={cn('group relative h-9 flex items-center')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn('w-[130px] relative')}>
          <div className={cn('flex items-center gap-1.5')}>
            <Badge
              variant={getBadgeVariant(value, column.id as 'role' | 'status')}
              className={cn('capitalize')}
            >
              {value}
            </Badge>
            {isHovered && (
              <Button
                variant='ghost'
                size='icon'
                className={cn('h-6 w-6 p-0 opacity-70 hover:opacity-100')}
                onClick={() => setIsEditing(true)}
              >
                <Pencil className={cn('h-3 w-3')} />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-[130px] h-9 flex items-center')}>
      <Select
        value={value}
        onValueChange={onValueChange}
        onOpenChange={(open) => {
          if (!open && !updateUser.isPending) {
            setIsEditing(false)
          }
        }}
        open={true}
      >
        <SelectTrigger className={cn('h-8')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const { ref, inView } = useInView()
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = useUsers(
    50,
    sorting.length > 0 ? sorting[0].id : undefined,
    sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined
  )

  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.users) ?? [],
    [data]
  )

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'username',
      enableSorting: true,
      header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            className={cn('flex items-center gap-1 -ml-4 hover:bg-transparent group')}
            onClick={(e) => {
              const handler = column.getToggleSortingHandler()
              if (handler) {
                console.log('Username column clicked:', {
                  currentSort: column.getIsSorted(),
                  sortIndex: column.getSortIndex(),
                  canSort: column.getCanSort(),
                  nextSortingOrder: column.getNextSortingOrder(),
                })
                handler(e)
              }
            }}
            type="button"
          >
            Username
            {column.getIsSorted() ? (
              column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-500" />
              )
            ) : (
              <ArrowUpDown className={cn('h-4 w-4 opacity-0 group-hover:opacity-50')} />
            )}
          </Button>
        )
      },
      cell: (props) => <EditableCell {...props} table={table} refetch={refreshData} />,
    },
    {
      accessorKey: 'email',
      enableSorting: true,
      header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            className={cn('flex items-center gap-1 -ml-4 hover:bg-transparent group')}
            onClick={(e) => {
              console.log('Email column clicked:', {
                currentSort: column.getIsSorted(),
                sortIndex: column.getSortIndex(),
                canSort: column.getCanSort(),
              })
              column.getToggleSortingHandler()?.(e)
            }}
            type="button"
          >
            Email
            {column.getIsSorted() ? (
              column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-500" />
              )
            ) : (
              <ArrowUpDown className={cn('h-4 w-4 opacity-0 group-hover:opacity-50')} />
            )}
          </Button>
        )
      },
      cell: (props) => <EditableCell {...props} table={table} refetch={refreshData} />,
    },
    {
      accessorKey: 'firstName',
      enableSorting: true,
      header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            className={cn('flex items-center gap-1 -ml-4 hover:bg-transparent group')}
            onClick={(e) => {
              console.log('First Name column clicked:', {
                currentSort: column.getIsSorted(),
                sortIndex: column.getSortIndex(),
                canSort: column.getCanSort(),
              })
              column.getToggleSortingHandler()?.(e)
            }}
            type="button"
          >
            First Name
            {column.getIsSorted() ? (
              column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-500" />
              )
            ) : (
              <ArrowUpDown className={cn('h-4 w-4 opacity-0 group-hover:opacity-50')} />
            )}
          </Button>
        )
      },
      cell: (props) => <EditableCell {...props} table={table} refetch={refreshData} />,
    },
    {
      accessorKey: 'lastName',
      enableSorting: true,
      header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            className={cn('flex items-center gap-1 -ml-4 hover:bg-transparent group')}
            onClick={(e) => {
              console.log('Last Name column clicked:', {
                currentSort: column.getIsSorted(),
                sortIndex: column.getSortIndex(),
                canSort: column.getCanSort(),
              })
              column.getToggleSortingHandler()?.(e)
            }}
            type="button"
          >
            Last Name
            {column.getIsSorted() ? (
              column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-500" />
              )
            ) : (
              <ArrowUpDown className={cn('h-4 w-4 opacity-0 group-hover:opacity-50')} />
            )}
          </Button>
        )
      },
      cell: (props) => <EditableCell {...props} table={table} refetch={refreshData} />,
    },
    {
      accessorKey: 'role',
      enableSorting: false,
      header: 'Role',
      cell: (props) => (
        <SelectCell
          {...props}
          options={Object.values(userRoleSchema.enum)}
          table={table}
          refetch={refreshData}
        />
      ),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: 'Status',
      cell: (props) => (
        <SelectCell
          {...props}
          options={Object.values(userStatusSchema.enum)}
          table={table}
          refetch={refreshData}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      enableSorting: true,
      header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            className={cn('flex items-center gap-1 -ml-4 hover:bg-transparent group')}
            onClick={column.getToggleSortingHandler()}
            type="button"
          >
            Created At
            {column.getIsSorted() ? (
              column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-500" />
              )
            ) : (
              <ArrowUpDown className={cn('h-4 w-4 opacity-0 group-hover:opacity-50')} />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className={cn('font-medium')}>
          {formatDate(row.getValue('createdAt'))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original
        const deleteUser = useDeleteUser()
  
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className={cn('h-8 w-8 p-0')}>
                <span className={cn('sr-only')}>Open menu</span>
                <MoreHorizontal className={cn('h-4 w-4')} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  deleteUser.mutate(user.id, {
                    onSuccess: () => {
                      toast({
                        title: 'Success',
                        description: 'User deleted successfully',
                      })
                    },
                    onError: () => {
                      toast({
                        title: 'Error',
                        description: 'Failed to delete user',
                        variant: 'destructive',
                      })
                    },
                  })
                }}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className={cn('mr-2 h-4 w-4 animate-spin')} />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      console.log('Table sorting change:', {
        currentSorting: sorting,
        updater: typeof updater === 'function' ? 'function' : updater
      })
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      console.log('New sorting state:', newSorting)
      setSorting(newSorting)
    },
    manualSorting: true,
    enableSortingRemoval: false,
    enableMultiSort: false,
    sortDescFirst: false,
  })

  // Function to force a refetch with current sorting
  const refreshData = () => {
    // Just refetch - useUsers hook already has the current sorting state
    refetch()
  }

  // Add debug effect for sorting state changes
  useEffect(() => {
    console.log('Sorting state changed:', {
      sorting,
      hasSort: sorting.length > 0,
      sortDetails: sorting[0] ? {
        column: sorting[0].id,
        direction: sorting[0].desc ? 'desc' : 'asc'
      } : 'none'
    })
  }, [sorting])

  // Single debug effect for all state changes
  const [prevState, setPrevState] = useState({
    sorting: [] as SortingState,
    dataLength: 0,
    isLoading: false
  })

  useEffect(() => {
    const currentState = {
      sorting,
      dataLength: flatData.length,
      isLoading
    }

    const hasSortingChanged = JSON.stringify(prevState.sorting) !== JSON.stringify(currentState.sorting)
    const hasDataChanged = prevState.dataLength !== currentState.dataLength
    const hasLoadingChanged = prevState.isLoading !== currentState.isLoading

    if (hasSortingChanged || hasDataChanged || hasLoadingChanged) {
      console.log('State update:', {
        sorting: sorting.length > 0 ? {
          field: sorting[0].id,
          order: sorting[0].desc ? 'desc' : 'asc'
        } : 'none',
        data: {
          total: flatData.length,
          pages: data?.pages?.length ?? 0,
          isLoading,
          isFetchingMore: isFetchingNextPage,
          hasMore: hasNextPage
        }
      })
      setPrevState(currentState)
    }
  }, [sorting, data, flatData, isLoading, isFetchingNextPage, hasNextPage])

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  return (
    <div className={cn('rounded-md border')}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn('h-24 text-center')}
              >
                <div className={cn('flex items-center justify-center gap-2')}>
                  <Loader2 className={cn('h-4 w-4 animate-spin')} />
                  Loading...
                </div>
              </TableCell>
            </TableRow>
          ) : flatData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn('h-24 text-center')}
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow ref={ref}>
                <TableCell
                  colSpan={columns.length}
                  className={cn('h-24 text-center')}
                >
                  {isFetchingNextPage ? (
                    <div className={cn('flex items-center justify-center gap-2')}>
                      <Loader2 className={cn('h-4 w-4 animate-spin')} />
                      Loading more...
                    </div>
                  ) : hasNextPage ? (
                    'Load more'
                  ) : (
                    'No more users'
                  )}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
      {data?.pages[0]?.total !== undefined && (
        <div className={cn('p-4 text-sm text-muted-foreground')}>
          Total users: {data.pages[0].total}
        </div>
      )}
    </div>
  )
}
