'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Types ─────────────────────────────────────────

interface Competency {
  id: string
  name: string
  shortName: string
  weight: number
  description: string
}

interface Candidate {
  id: number
  name: string
  initials: string
  currentRole: string
  currentCompany: string
  experience: number
  status: 'approved' | 'analyzing' | 'waitlist' | 'rejected'
  scores: Record<string, number>
  avatarColor: string
}

// ─── Mock Data ─────────────────────────────────────

const competencies: Competency[] = [
  {
    id: 'direito-trabalho',
    name: 'Direito do Trabalho',
    shortName: 'Dir. Trabalho',
    weight: 0.25,
    description: 'CLT, reforma trabalhista, jurisprudência TST',
  },
  {
    id: 'contencioso',
    name: 'Contencioso Trabalhista',
    shortName: 'Contencioso',
    weight: 0.2,
    description: 'Audiências, recursos, estratégia processual',
  },
  {
    id: 'negociacao',
    name: 'Negociação',
    shortName: 'Negociação',
    weight: 0.15,
    description: 'Acordos, mediação, negociação coletiva',
  },
  {
    id: 'raciocinio',
    name: 'Raciocínio Jurídico',
    shortName: 'Raciocínio',
    weight: 0.15,
    description: 'Análise de risco, teses jurídicas',
  },
  {
    id: 'comunicacao',
    name: 'Comunicação',
    shortName: 'Comunicação',
    weight: 0.1,
    description: 'Escrita, oratória, apresentação',
  },
  {
    id: 'fit-cultural',
    name: 'Fit Cultural',
    shortName: 'Fit Cultural',
    weight: 0.1,
    description: 'Valores, trabalho em equipe, adaptação',
  },
  {
    id: 'lideranca',
    name: 'Liderança',
    shortName: 'Liderança',
    weight: 0.05,
    description: 'Gestão de equipe, mentoria, iniciativa',
  },
]

const candidates: Candidate[] = [
  {
    id: 1,
    name: 'Marina Silva Oliveira',
    initials: 'MS',
    currentRole: 'Advogada Sênior',
    currentCompany: 'Machado Meyer',
    experience: 12,
    status: 'approved',
    avatarColor: 'bg-emerald-600',
    scores: {
      'direito-trabalho': 9.5,
      contencioso: 9.2,
      negociacao: 8.8,
      raciocinio: 9.3,
      comunicacao: 9.0,
      'fit-cultural': 8.5,
      lideranca: 8.7,
    },
  },
  {
    id: 2,
    name: 'Rafael Santos Costa',
    initials: 'RS',
    currentRole: 'Advogado Pleno III',
    currentCompany: 'TozziniFreire',
    experience: 10,
    status: 'approved',
    avatarColor: 'bg-blue-600',
    scores: {
      'direito-trabalho': 8.8,
      contencioso: 9.0,
      negociacao: 8.5,
      raciocinio: 8.6,
      comunicacao: 8.2,
      'fit-cultural': 8.0,
      lideranca: 7.8,
    },
  },
  {
    id: 3,
    name: 'Juliana Ferreira Lima',
    initials: 'JF',
    currentRole: 'Coordenadora Jurídica',
    currentCompany: 'Pinheiro Neto',
    experience: 9,
    status: 'approved',
    avatarColor: 'bg-violet-600',
    scores: {
      'direito-trabalho': 9.0,
      contencioso: 8.2,
      negociacao: 8.0,
      raciocinio: 8.5,
      comunicacao: 8.8,
      'fit-cultural': 7.5,
      lideranca: 8.0,
    },
  },
  {
    id: 4,
    name: 'Carlos Eduardo Martins',
    initials: 'CE',
    currentRole: 'Advogado Sênior',
    currentCompany: 'Mattos Filho',
    experience: 11,
    status: 'analyzing',
    avatarColor: 'bg-amber-600',
    scores: {
      'direito-trabalho': 8.5,
      contencioso: 7.8,
      negociacao: 7.5,
      raciocinio: 8.0,
      comunicacao: 7.0,
      'fit-cultural': 7.8,
      lideranca: 7.5,
    },
  },
  {
    id: 5,
    name: 'Ana Beatriz Rodrigues',
    initials: 'AB',
    currentRole: 'Advogada Trabalhista',
    currentCompany: 'Veirano Advogados',
    experience: 8,
    status: 'analyzing',
    avatarColor: 'bg-pink-600',
    scores: {
      'direito-trabalho': 7.8,
      contencioso: 7.5,
      negociacao: 8.2,
      raciocinio: 7.0,
      comunicacao: 8.5,
      'fit-cultural': 8.0,
      lideranca: 7.0,
    },
  },
  {
    id: 6,
    name: 'Pedro Henrique Almeida',
    initials: 'PH',
    currentRole: 'Advogado Pleno',
    currentCompany: 'Demarest',
    experience: 7,
    status: 'analyzing',
    avatarColor: 'bg-cyan-600',
    scores: {
      'direito-trabalho': 7.5,
      contencioso: 7.0,
      negociacao: 7.8,
      raciocinio: 7.2,
      comunicacao: 6.8,
      'fit-cultural': 7.5,
      lideranca: 6.5,
    },
  },
  {
    id: 7,
    name: 'Fernanda Souza Barros',
    initials: 'FS',
    currentRole: 'Advogada Trabalhista',
    currentCompany: 'Lefosse',
    experience: 6,
    status: 'waitlist',
    avatarColor: 'bg-orange-600',
    scores: {
      'direito-trabalho': 7.0,
      contencioso: 6.5,
      negociacao: 7.2,
      raciocinio: 6.8,
      comunicacao: 7.5,
      'fit-cultural': 6.0,
      lideranca: 6.8,
    },
  },
  {
    id: 8,
    name: 'Lucas Andrade Vieira',
    initials: 'LA',
    currentRole: 'Advogado Júnior',
    currentCompany: 'Stocche Forbes',
    experience: 5,
    status: 'rejected',
    avatarColor: 'bg-slate-600',
    scores: {
      'direito-trabalho': 6.5,
      contencioso: 6.0,
      negociacao: 5.8,
      raciocinio: 6.2,
      comunicacao: 7.0,
      'fit-cultural': 5.5,
      lideranca: 5.5,
    },
  },
]

// ─── Helpers ───────────────────────────────────────

function calculateWeightedTotal(scores: Record<string, number>): number {
  return competencies.reduce((total, comp) => {
    return total + (scores[comp.id] || 0) * comp.weight
  }, 0)
}


function getTotalScoreColorClass(score: number): string {
  if (score >= 85) return 'bg-emerald-600 text-on-surface'
  if (score >= 75) return 'bg-sky-600 text-on-surface'
  if (score >= 65) return 'bg-amber-600 text-on-surface'
  return 'bg-rose-600 text-on-surface'
}

const statusConfig = {
  approved: { label: 'Aprovado', variant: 'success' as const },
  analyzing: { label: 'Em análise', variant: 'info' as const },
  waitlist: { label: 'Lista de espera', variant: 'warning' as const },
  rejected: { label: 'Reprovado', variant: 'destructive' as const },
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />
  if (rank === 2) return <Award className="h-4 w-4 text-slate-400" />
  if (rank === 3) return <Award className="h-4 w-4 text-amber-700" />
  return (
    <span className="text-xs font-medium text-muted-foreground">{rank}º</span>
  )
}

// ─── Component ─────────────────────────────────────

export default function RecrutamentoScorecardPage() {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sortedCandidates = useMemo(() => {
    return [...candidates]
      .map((c) => ({ ...c, total: calculateWeightedTotal(c.scores) * 10 }))
      .sort((a, b) =>
        sortDirection === 'desc' ? b.total - a.total : a.total - b.total
      )
  }, [sortDirection])

  const stats = useMemo(() => {
    const totals = sortedCandidates.map((c) => c.total)
    return {
      total: candidates.length,
      approved: candidates.filter((c) => c.status === 'approved').length,
      analyzing: candidates.filter((c) => c.status === 'analyzing').length,
      avgScore: totals.reduce((s, v) => s + v, 0) / totals.length,
    }
  }, [sortedCandidates])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-muted/40">
        {/* ─── Navigation ─── */}
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto flex h-14 max-w-350 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-heading font-semibold tracking-tight">
                Zattar Recruit
              </span>
            </div>
            <Badge variant="outline">Demo</Badge>
          </div>
        </nav>

        {/* ─── Header ─── */}
        <div className="border-b bg-background">
          <div className="mx-auto max-w-350 px-6 py-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" tone="soft">
                Vaga #2024-087
              </Badge>
              <Badge variant="success" tone="solid">
                Ativa
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Advogado Trabalhista Sênior
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Departamento Jurídico
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                São Paulo, SP
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Aberta em 26/02/2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                15 dias
              </span>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <main className="mx-auto max-w-350 px-6 py-6 space-y-6">
          {/* ─── KPI Cards ─── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Candidatos</p>
                    <p className="text-2xl font-bold font-heading">
                      {stats.total}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/45" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Score Médio</p>
                    <p className="text-2xl font-bold font-heading">
                      {stats.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground/45" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                    <p className="text-2xl font-bold font-heading text-emerald-600">
                      {stats.approved}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-muted-foreground/45" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Análise</p>
                    <p className="text-2xl font-bold font-heading text-sky-600">
                      {stats.analyzing}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground/45" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Scorecard Table ─── */}
          <Card>
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold font-heading">
                    Scorecard
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Avaliação por competências com pontuação ponderada
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))
                  }
                  className="cursor-pointer"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                  {sortDirection === 'desc' ? 'Maior score' : 'Menor score'}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="min-w-60">Candidato</TableHead>
                    {competencies.map((comp) => (
                      <TableHead
                        key={comp.id}
                        className="text-center min-w-22.5"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-0.5 cursor-help">
                              <span className="text-xs font-medium">
                                {comp.shortName}
                              </span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {(comp.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-50">
                            <p className="font-medium">{comp.name}</p>
                            <p className="text-muted-foreground">
                              {comp.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /100
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center min-w-30">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCandidates.map((candidate, index) => {
                    const rank =
                      sortDirection === 'desc'
                        ? index + 1
                        : sortedCandidates.length - index
                    const status = statusConfig[candidate.status]

                    return (
                      <TableRow
                        key={candidate.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center h-6 w-6 mx-auto">
                            {getRankIcon(rank)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={`${candidate.avatarColor} text-on-surface text-xs font-medium`}
                              >
                                {candidate.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-none truncate">
                                {candidate.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {candidate.currentRole} &middot;{' '}
                                {candidate.currentCompany} &middot;{' '}
                                {candidate.experience} anos
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {competencies.map((comp) => {
                          const score = candidate.scores[comp.id]
                          return (
                            <TableCell
                              key={comp.id}
                              className="text-center px-1.5 py-2"
                            >
                              <span
                                className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums min-w-12etScoreColorClass(score)}`}
                              >
                                {score.toFixed(1)}
                              </span>
                            </TableCell>
                          )
                        })}

                        <TableCell className="text-center px-1.5 py-2">
                          <span
                            className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums shadow-sm ${getTotalScoreColorClass(candidate.total)}`}
                          >
                            {candidate.total.toFixed(1)}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={status.variant} tone="soft">
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* ─── Legend ─── */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground pb-6">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" />
              Excelente (9.0+)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-sky-100 border border-sky-200 dark:bg-sky-950 dark:border-sky-800" />
              Bom (7.5–8.9)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 dark:bg-amber-950 dark:border-amber-800" />
              Regular (6.0–7.4)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-rose-100 border border-rose-200 dark:bg-rose-950 dark:border-rose-800" />
              Abaixo (&lt;6.0)
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
