'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Folder, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DriveFolder {
  id: string
  name: string
  path: string
  hasChildren: boolean
}

interface FolderNode extends DriveFolder {
  children?: FolderNode[]
  isExpanded?: boolean
  isLoading?: boolean
}

interface DriveFolderPickerProps {
  onSelect: (path: string, folderId: string) => void
  onCancel: () => void
  currentPath?: string
}

export function DriveFolderPicker({ onSelect, onCancel, currentPath = '/' }: DriveFolderPickerProps) {
  const { toast } = useToast()
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPath, setSelectedPath] = useState(currentPath)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')

  useEffect(() => {
    loadRootFolders()
  }, [])

  const loadRootFolders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/integrations/google-drive/folders?parentId=root')
      
      if (!response.ok) {
        throw new Error('Failed to load folders')
      }

      const data = await response.json()
      const folders: FolderNode[] = data.folders.map((f: DriveFolder) => ({
        ...f,
        path: `/${f.name}`,
        isExpanded: false,
        children: [],
      }))

      setRootFolders(folders)
    } catch (error: any) {
      console.error('Failed to load folders:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load folders from Drive',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubfolders = async (node: FolderNode, parentPath: string) => {
    try {
      // Mark as loading
      updateNodeLoading(node.id, true)

      const response = await fetch(`/api/integrations/google-drive/folders?parentId=${node.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to load subfolders')
      }

      const data = await response.json()
      const subfolders: FolderNode[] = data.folders.map((f: DriveFolder) => ({
        ...f,
        path: `${parentPath}/${f.name}`,
        isExpanded: false,
        children: [],
      }))

      // Update node with children
      updateNodeChildren(node.id, subfolders)
    } catch (error: any) {
      console.error('Failed to load subfolders:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load subfolders',
        variant: 'destructive',
      })
      updateNodeLoading(node.id, false)
    }
  }

  const updateNodeLoading = (nodeId: string, isLoading: boolean) => {
    const updateNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isLoading }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    setRootFolders(updateNode(rootFolders))
  }

  const updateNodeChildren = (nodeId: string, children: FolderNode[]) => {
    const updateNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, children, isExpanded: true, isLoading: false }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    setRootFolders(updateNode(rootFolders))
  }

  const toggleFolder = async (node: FolderNode, parentPath: string) => {
    if (node.isExpanded) {
      // Collapse
      const updateNode = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.map(n => {
          if (n.id === node.id) {
            return { ...n, isExpanded: false }
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) }
          }
          return n
        })
      }
      setRootFolders(updateNode(rootFolders))
    } else {
      // Expand
      if (node.hasChildren && (!node.children || node.children.length === 0)) {
        await loadSubfolders(node, parentPath)
      } else {
        const updateNode = (nodes: FolderNode[]): FolderNode[] => {
          return nodes.map(n => {
            if (n.id === node.id) {
              return { ...n, isExpanded: true }
            }
            if (n.children) {
              return { ...n, children: updateNode(n.children) }
            }
            return n
          })
        }
        setRootFolders(updateNode(rootFolders))
      }
    }
  }

  const handleSelectFolder = (path: string, folderId: string) => {
    setSelectedPath(path)
    setSelectedFolderId(folderId)
  }

  const handleConfirm = () => {
    onSelect(selectedPath, selectedFolderId)
  }

  const renderFolder = (node: FolderNode, level: number = 0, parentPath: string = '') => {
    const isSelected = selectedPath === node.path
    const indent = level * 24

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => handleSelectFolder(node.path, node.id)}
        >
          <div className="flex items-center flex-1 gap-2">
            {node.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(node, parentPath)
                }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {node.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : node.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
            {!node.hasChildren && <div className="w-5" />}
            <Folder className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className={`text-sm ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>
              {node.name}
            </span>
          </div>
        </div>
        {node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFolder(child, level + 1, node.path))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-2 border-blue-200 rounded-lg bg-white">
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Select Google Drive Folder</h4>
        </div>
        <p className="text-sm text-blue-700">
          Selected: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{selectedPath}</span>
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading folders...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Root folder */}
            <div
              className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer rounded ${
                selectedPath === '/' ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => handleSelectFolder('/', 'root')}
            >
              <Folder className={`h-4 w-4 mr-2 ${selectedPath === '/' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-sm ${selectedPath === '/' ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>
                / (Root)
              </span>
            </div>

            {/* Folder tree */}
            {rootFolders.map(folder => renderFolder(folder, 0, ''))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Select Folder
        </Button>
      </div>
    </div>
  )
}
