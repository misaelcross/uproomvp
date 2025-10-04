// Session Sync - Sincroniza sessões entre domínios
// Este módulo garante que a autenticação funcione entre domínio principal e subdomínios

import { SessionManager, Session } from './session-manager'
import { CrossDomainAuth } from './cross-domain-auth'

export class SessionSync {
  /**
   * Sincronizar sessão localmente apenas (sem cross-domain)
   */
  static syncSession(session: Session) {
    console.log('🔄 SessionSync: Salvando sessão localmente')
    
    // Salvar apenas na SessionManager (sem cross-domain sync)
    SessionManager.saveSession(session)
    
    console.log('✅ SessionSync: Sessão salva localmente')
  }

  /**
   * Verificar se há sessão local apenas
   */
  static checkSharedSession(): Session | null {
    console.log('🔍 SessionSync: Verificando sessão local')
    
    // Verificar apenas SessionManager (sem cross-domain)
    const localSession = SessionManager.getSession()
    if (localSession) {
      console.log('✅ SessionSync: Sessão local encontrada')
      return localSession
    }

    console.log('❌ SessionSync: Nenhuma sessão local encontrada')
    return null
  }

  /**
   * Validar token com backend
   */
  static async validateToken(token: string): Promise<Session | null> {
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ SessionSync: Token válido, criando sessão')
        
        // Criar sessão
        const session: Session = {
          access_token: token,
          refresh_token: '',
          expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 dias
          user: data.user
        }
        
        // Salvar sessão
        SessionManager.saveSession(session)
        
        return session
      } else {
        console.log('❌ SessionSync: Token inválido')
        CrossDomainAuth.clearAuthToken()
        SessionManager.clearSession()
        return null
      }
    } catch (error) {
      console.error('❌ SessionSync: Erro ao validar token:', error)
      return null
    }
  }

  /**
   * Limpar sessão local apenas
   */
  static clearAllSessions() {
    console.log('🧹 SessionSync: Limpando sessão local')
    
    // Clear session manager
    SessionManager.clearSession()
    
    // Clear localStorage completely
    localStorage.removeItem('auth_token')
    localStorage.removeItem('session_data')
    localStorage.removeItem('user_data')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    console.log('✅ SessionSync: Sessão local limpa')
  }

  /**
   * Verificar se estamos em um subdomínio
   */
  static isOnSubdomain(): boolean {
    return CrossDomainAuth.isSubdomain()
  }

  /**
   * Obter domínio principal
   */
  static getMainDomain(): string {
    return CrossDomainAuth.getMainDomain()
  }

  /**
   * Redirecionar para domínio principal para autenticação
   */
  static redirectToMainForAuth() {
    console.log('🔄 SessionSync: Redirecionando para domínio principal para autenticação')
    CrossDomainAuth.redirectToMainDomainForAuth()
  }

  /**
   * Lidar com redirecionamento após autenticação
   */
  static handleAuthRedirect() {
    console.log('🔄 SessionSync: Lidando com redirecionamento após autenticação')
    CrossDomainAuth.handleAuthRedirect()
  }

  /**
   * Verificar se a sessão está próxima do vencimento
   */
  static isSessionExpiringSoon(): boolean {
    return SessionManager.isSessionExpiringSoon()
  }

  /**
   * Renovar sessão se necessário
   */
  static async refreshSessionIfNeeded(): Promise<boolean> {
    if (this.isSessionExpiringSoon()) {
      console.log('🔄 SessionSync: Sessão próxima do vencimento, tentando renovar...')
      
      const token = SessionManager.getToken()
      if (!token) return false

      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')
        const response = await fetch(`${API_URL}/auth/session`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          SessionManager.refreshSession(data.session.access_token)
          console.log('✅ SessionSync: Sessão renovada com sucesso')
          return true
        }
      } catch (error) {
        console.error('❌ SessionSync: Erro ao renovar sessão:', error)
      }
    }

    return false
  }
}
