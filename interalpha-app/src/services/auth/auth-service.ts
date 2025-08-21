import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { 
  UserType, 
  EmployeeRole, 
  ClientAccessKey, 
  EmployeeSession, 
  LoginCredentials,
  AuthErrorCode,
  SessionMetadata,
  ClientPermissions
} from '@/types/auth'

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private readonly CLIENT_KEY_TTL = 24 * 60 * 60 * 1000 // 24 horas em ms

  // ==================== CLIENTE - CHAVES TEMPORÁRIAS ====================
  // Delegado para clientKeyService
  
  async generateClientKey(clientId: string, metadata: Partial<SessionMetadata>): Promise<ClientAccessKey> {
    // Método mantido para compatibilidade, mas delega para o novo serviço
    const { clientKeyService } = await import('@/services/client-access/client-key-service')
    return clientKeyService.generateClientKey(clientId, 'system', { metadata })
  }

  async validateClientKey(key: string): Promise<{ valid: boolean; session?: any; error?: string }> {
    // Método mantido para compatibilidade, mas delega para o novo serviço
    const { clientKeyService } = await import('@/services/client-access/client-key-service')
    return clientKeyService.validateClientKey(key)
  }

  async revokeClientKey(key: string): Promise<void> {
    // Método mantido para compatibilidade, mas delega para o novo serviço
    const { clientKeyService } = await import('@/services/client-access/client-key-service')
    await clientKeyService.revokeClientKey(key, 'system')
  }

  // ==================== FUNCIONÁRIO - AUTENTICAÇÃO ====================

  async authenticateEmployee(credentials: LoginCredentials, metadata: Partial<SessionMetadata>): Promise<{ success: boolean; session?: EmployeeSession; token?: string; error?: string }> {
    try {
      // Buscar funcionário no banco
      const employee = await this.findEmployeeByEmail(credentials.email)
      
      if (!employee) {
        return { success: false, error: AuthErrorCode.INVALID_CREDENTIALS }
      }

      if (!employee.isActive) {
        return { success: false, error: AuthErrorCode.ACCOUNT_DISABLED }
      }

      // Verificar senha
      const passwordValid = await bcrypt.compare(credentials.password, employee.passwordHash)
      if (!passwordValid) {
        return { success: false, error: AuthErrorCode.INVALID_CREDENTIALS }
      }

      // Criar sessão
      const session: EmployeeSession = {
        userId: employee.id,
        role: employee.role,
        permissions: employee.permissions,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 horas
        metadata: {
          ipAddress: metadata.ipAddress || '',
          userAgent: metadata.userAgent || '',
          loginAt: new Date(),
          lastActivity: new Date()
        }
      }

      // Gerar JWT token
      const token = this.generateJWT({
        userId: employee.id,
        role: employee.role,
        type: UserType.EMPLOYEE
      })

      // Atualizar último login
      await this.updateLastLogin(employee.id)

      return { success: true, session, token }
    } catch (error) {
      return { success: false, error: 'AUTHENTICATION_ERROR' }
    }
  }

  async validateEmployeeSession(token: string): Promise<{ valid: boolean; session?: EmployeeSession; error?: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      
      if (decoded.type !== UserType.EMPLOYEE) {
        return { valid: false, error: AuthErrorCode.INVALID_CREDENTIALS }
      }

      // Buscar funcionário atualizado
      const employee = await this.findEmployeeById(decoded.userId)
      
      if (!employee || !employee.isActive) {
        return { valid: false, error: AuthErrorCode.ACCOUNT_DISABLED }
      }

      const session: EmployeeSession = {
        userId: employee.id,
        role: employee.role,
        permissions: employee.permissions,
        expiresAt: new Date(decoded.exp * 1000),
        metadata: {
          ipAddress: '',
          userAgent: '',
          loginAt: new Date(decoded.iat * 1000),
          lastActivity: new Date()
        }
      }

      return { valid: true, session }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: AuthErrorCode.EXPIRED_TOKEN }
      }
      return { valid: false, error: AuthErrorCode.INVALID_CREDENTIALS }
    }
  }

  async refreshEmployeeToken(refreshToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any
      
      // Gerar novo token
      const newToken = this.generateJWT({
        userId: decoded.userId,
        role: decoded.role,
        type: UserType.EMPLOYEE
      })

      return { success: true, token: newToken }
    } catch (error) {
      return { success: false, error: AuthErrorCode.EXPIRED_TOKEN }
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private generateJWT(payload: any): string {
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: '8h',
      issuer: 'interalpha-portal'
    })
  }

  private getDefaultClientPermissions(): ClientPermissions {
    return {
      canViewOrders: true,
      canViewPayments: true,
      canViewDocuments: true,
      canChat: true
    }
  }

  // ==================== MÉTODOS DE BANCO (IMPLEMENTAR) ====================

  private async saveClientKey(accessKey: ClientAccessKey): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving client key:', accessKey.key)
  }

  private async findClientKey(key: string): Promise<ClientAccessKey | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async deleteClientKey(key: string): Promise<void> {
    // TODO: Implementar deleção no banco
    console.log('Deleting client key:', key)
  }

  private async findEmployeeByEmail(email: string): Promise<any> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findEmployeeById(id: string): Promise<any> {
    // TODO: Implementar busca no banco
    return null
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log('Updating last login for user:', userId)
  }
}

export const authService = new AuthService()