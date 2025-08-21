'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, Edit, Trash2, MoreHorizontal, Shield, Mail, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import EmployeeStats from '@/components/admin/EmployeeStats'
import { PermissionGuard, AdminOnly } from '@/components/auth/PermissionGuard'
import { Permission } from '@/lib/auth/permissions'

interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  department?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  permissions: string[]
}

const EMPLOYEE_ROLES = [
  { value: 'atendente', label: 'Atendente', color: 'bg-blue-100 text-blue-800' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-green-100 text-green-800' },
  { value: 'supervisor_tecnico', label: 'Supervisor Técnico', color: 'bg-purple-100 text-purple-800' },
  { value: 'gerente_adm', label: 'Gerente Administrativo', color: 'bg-orange-100 text-orange-800' },
  { value: 'gerente_financeiro', label: 'Gerente Financeiro', color: 'bg-red-100 text-red-800' },
  { value: 'admin', label: 'Administrador', color: 'bg-gray-100 text-gray-800' }
]

const DEPARTMENTS = [
  'Atendimento',
  'Técnico',
  'Administrativo',
  'Financeiro',
  'Comercial',
  'TI'
]

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: '',
    permissions: [] as string[]
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/funcionarios')
      const result = await response.json()
      
      if (result.success) {
        setEmployees(result.data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar funcionários",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/admin/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário criado com sucesso"
        })
        setShowCreateDialog(false)
        resetForm()
        fetchEmployees()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar funcionário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar funcionário",
        variant: "destructive"
      })
    }
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return

    try {
      const response = await fetch(`/api/admin/funcionarios/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário atualizado com sucesso"
        })
        setEditingEmployee(null)
        resetForm()
        fetchEmployees()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar funcionário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar funcionário",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return

    try {
      const response = await fetch(`/api/admin/funcionarios/${employeeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário excluído com sucesso"
        })
        fetchEmployees()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao excluir funcionário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: '',
      permissions: []
    })
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
      department: employee.department || '',
      password: '',
      confirmPassword: '',
      permissions: employee.permissions
    })
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = EMPLOYEE_ROLES.find(r => r.value === role)
    return (
      <Badge className={roleConfig?.color || 'bg-gray-100 text-gray-800'}>
        {roleConfig?.label || role}
      </Badge>
    )
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && employee.isActive) ||
                         (statusFilter === 'inactive' && !employee.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <PermissionGuard permission={Permission.VIEW_EMPLOYEES}>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Gestão de Funcionários 👥
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee ? 'Atualize os dados do funcionário' : 'Crie um novo usuário no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do funcionário"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!editingEmployee && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha temporária"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme a senha"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false)
                setEditingEmployee(null)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}>
                {editingEmployee ? 'Atualizar' : 'Criar'} Funcionário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <EmployeeStats />

      {/* Filtros */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Funcionários
            <Badge variant="outline" className="ml-2">
              {filteredEmployees.length} funcionários
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {EMPLOYEE_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Funcionários */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50 hover:shadow-md transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {employee.name}
                      </h3>
                      {getRoleBadge(employee.role)}
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </div>
                      )}
                      {employee.department && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {employee.department}
                        </div>
                      )}
                    </div>
                    {employee.lastLogin && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        Último acesso: {new Date(employee.lastLogin).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum funcionário encontrado</h3>
              <p className="text-sm">
                {searchTerm || (roleFilter !== 'all') || (statusFilter !== 'all')
                  ? 'Tente ajustar os filtros de busca'
                  : 'Cadastre o primeiro funcionário para começar'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => {
        if (!open) {
          setEditingEmployee(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize os dados do funcionário
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do funcionário"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Cargo *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-department">Departamento</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {
              setEditingEmployee(null)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEmployee}>
              Atualizar Funcionário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGuard>
  )
}