import { Building2, Briefcase, LogOut, Settings, TrendingUp, Users } from 'lucide-react'
import { signOut } from '../auth/authApi'
import { useAuth } from '../auth/useAuth'
import { Brand } from './Brand'
import { ExcluirPerfilButton } from './ExcluirPerfil'
import { ThemeToggle } from './ThemeToggle'

interface AppPlaceholderProps {
  /** Chamado após a exclusão do perfil com sucesso (leva o usuário ao /onboarding). */
  onExcluido: () => void
}

export function AppPlaceholder({ onExcluido }: AppPlaceholderProps) {
  const { usuario } = useAuth()
  const isStartup = usuario?.tipo === 'startup'

  return (
    <main id="conteudo" className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-brand">
            <Brand />
            <div className="dashboard-user-info">
              <p className="kicker">Painel Altura</p>
              <h1>Olá, {usuario?.nome || 'bem-vindo(a)'}</h1>
            </div>
          </div>
          <div className="dashboard-actions">
            <ThemeToggle />
            <a className="button button-ghost button-compact" href="/editar-perfil">
              <Settings size={18} aria-hidden="true" />
              <span>Editar perfil</span>
            </a>
            <ExcluirPerfilButton onExcluido={onExcluido} />
            <button className="button button-outline button-compact" type="button" onClick={() => void signOut()}>
              <LogOut size={18} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Visão geral</h2>
            <p className="section-description">
              {isStartup
                ? 'Acompanhe o progresso da sua startup e suas rodadas de captação.'
                : 'Acompanhe suas conexões e oportunidades de investimento.'}
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-navy">
                {isStartup ? <Briefcase size={24} aria-hidden="true" /> : <Users size={24} aria-hidden="true" />}
              </div>
              <div className="stat-content">
                <p className="stat-label">{isStartup ? 'Rodadas abertas' : 'Conexões'}</p>
                <p className="stat-value">0</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-teal">
                <TrendingUp size={24} aria-hidden="true" />
              </div>
              <div className="stat-content">
                <p className="stat-label">{isStartup ? 'Valor captado' : 'Investimentos'}</p>
                <p className="stat-value">
                  R$ 0
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-navy">
                {isStartup ? <Users size={24} aria-hidden="true" /> : <Building2 size={24} aria-hidden="true" />}
              </div>
              <div className="stat-content">
                <p className="stat-label">{isStartup ? 'Investidores' : 'Startups'}</p>
                <p className="stat-value">0</p>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Atividade recente</h2>
            <p className="section-description">
              {isStartup
                ? 'Propostas recebidas e atualizações das suas rodadas.'
                : 'Startups descobertas e propostas enviadas.'}
            </p>
          </div>

          <div className="activity-placeholder">
            <div className="activity-empty">
              <div className="activity-icon">
                {isStartup ? <Briefcase size={48} aria-hidden="true" /> : <Users size={48} aria-hidden="true" />}
              </div>
              <h3>Nenhuma atividade ainda</h3>
              <p>
                {isStartup
                  ? 'Abra sua primeira rodada de captação para começar a receber propostas.'
                  : 'Explore as rodadas disponíveis e envie suas primeiras propostas.'}
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Ações rápidas</h2>
            <p className="section-description">
              {isStartup
                ? 'Gerencie seu perfil e inicie novas rodadas.'
                : 'Gerencie seu perfil e descubra novas oportunidades.'}
            </p>
          </div>

          <div className="quick-actions">
            <a className="quick-action-card" href="/editar-perfil">
              <div className="quick-action-icon">
                <Settings size={24} aria-hidden="true" />
              </div>
              <div className="quick-action-content">
                <h3>Editar perfil</h3>
                <p>Atualize suas informações</p>
              </div>
            </a>

            {isStartup ? (
              <div className="quick-action-card quick-action-disabled">
                <div className="quick-action-icon">
                  <Briefcase size={24} aria-hidden="true" />
                </div>
                <div className="quick-action-content">
                  <h3>Nova rodada</h3>
                  <p>Em breve</p>
                </div>
              </div>
            ) : (
              <a className="quick-action-card" href="/explorar-rodadas">
                <div className="quick-action-icon">
                  <Users size={24} aria-hidden="true" />
                </div>
                <div className="quick-action-content">
                  <h3>Explorar rodadas</h3>
                  <p>Encontre oportunidades</p>
                </div>
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
