
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import type { Usuario } from '../../domain';
import {
  formatarCpf,
  formatarTelefone,
  formatarNomeExibicao,
} from '../../utils';
import { formatDate } from '@/lib/formatters';
import { User, Mail, Phone, FileText, Shield, MapPin, Calendar, UserCircle, Briefcase } from 'lucide-react';

interface UsuarioDadosBasicosProps {
  usuario: Usuario;
}

export function UsuarioDadosBasicos({ usuario }: UsuarioDadosBasicosProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Usuário
          </CardTitle>
            <div className="flex items-center gap-2">
              {usuario.isSuperAdmin && (
                <Badge variant="info">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
              <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Typography.Small className="text-muted-foreground uppercase tracking-wide">
            Identificação
          </Typography.Small>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography.Muted className="font-medium mb-1">
                Nome Completo
              </Typography.Muted>
              <div className="text-base">{usuario.nomeCompleto}</div>
            </div>
            <div>
              <Typography.Muted className="font-medium mb-1">
                Nome de Exibição
              </Typography.Muted>
              <div className="text-base">
                {formatarNomeExibicao(usuario.nomeExibicao)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {usuario.dataNascimento && (
              <div>
                <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Nascimento
                </Typography.Muted>
                <div className="text-base">
                  {formatDate(usuario.dataNascimento)}
                </div>
              </div>
            )}

            {usuario.genero && (
              <div>
                <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                  <UserCircle className="h-4 w-4" />
                  Gênero
                </Typography.Muted>
                <div className="text-base capitalize">
                  {usuario.genero.replace('_', ' ')}
                </div>
              </div>
            )}

            <div>
              <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                CPF
              </Typography.Muted>
              <div className="text-base">{formatarCpf(usuario.cpf)}</div>
            </div>

            {usuario.rg && (
              <div>
                <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  RG
                </Typography.Muted>
                <div className="text-base">{usuario.rg}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Typography.Small className="text-muted-foreground uppercase tracking-wide">
            Contato
          </Typography.Small>

          {(usuario.telefone || usuario.ramal) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usuario.telefone && (
                <div>
                  <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Typography.Muted>
                  <div className="text-base">{formatarTelefone(usuario.telefone)}</div>
                </div>
              )}

              {usuario.ramal && (
                <div>
                  <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Ramal
                  </Typography.Muted>
                  <div className="text-base">{usuario.ramal}</div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                E-mail Corporativo
              </Typography.Muted>
              <div className="text-base">{usuario.emailCorporativo}</div>
            </div>

            {usuario.emailPessoal && (
              <div>
                <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  E-mail Pessoal
                </Typography.Muted>
                <div className="text-base">{usuario.emailPessoal}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Typography.Small className="text-muted-foreground uppercase tracking-wide">
            Informações Profissionais
          </Typography.Small>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usuario.oab && (
              <>
                <div>
                  <Typography.Muted className="font-medium mb-1">
                    OAB
                  </Typography.Muted>
                  <div className="text-base">{usuario.oab}</div>
                </div>
                <div>
                  <Typography.Muted className="font-medium mb-1">
                    UF OAB
                  </Typography.Muted>
                  <div className="text-base">{usuario.ufOab}</div>
                </div>
              </>
            )}

            <div className={usuario.oab ? '' : 'md:col-span-3'}>
              <Typography.Muted className="font-medium mb-1 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Cargo
              </Typography.Muted>
              {usuario.cargo ? (
                <div>
                  <div className="text-base font-medium">{usuario.cargo.nome}</div>
                  {usuario.cargo.descricao && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {usuario.cargo.descricao}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-base text-muted-foreground">
                  Não informado
                </div>
              )}
            </div>
          </div>
        </div>

        {usuario.endereco && Object.values(usuario.endereco).some((v) => v) && (
          <>
            <Separator />
            <div className="space-y-4">
              <Typography.Small className="text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Endereço
              </Typography.Small>

              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {usuario.endereco.cep && (
                  <div>
                    <Typography.Muted className="font-medium mb-1">
                      CEP
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.cep}</div>
                  </div>
                )}

                {usuario.endereco.logradouro && (
                  <div className="md:col-span-2">
                    <Typography.Muted className="font-medium mb-1">
                      Logradouro
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.logradouro}</div>
                  </div>
                )}

                {usuario.endereco.numero && (
                  <div>
                    <Typography.Muted className="font-medium mb-1">
                      Número
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.numero}</div>
                  </div>
                )}

                {usuario.endereco.complemento && (
                  <div className="md:col-span-2">
                    <Typography.Muted className="font-medium mb-1">
                      Complemento
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.complemento}</div>
                  </div>
                )}

                {usuario.endereco.bairro && (
                  <div>
                    <Typography.Muted className="font-medium mb-1">
                      Bairro
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.bairro}</div>
                  </div>
                )}

                {usuario.endereco.cidade && (
                  <div className="md:col-span-2">
                    <Typography.Muted className="font-medium mb-1">
                      Cidade
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.cidade}</div>
                  </div>
                )}

                {usuario.endereco.estado && (
                  <div>
                    <Typography.Muted className="font-medium mb-1">
                      UF
                    </Typography.Muted>
                    <div className="text-base">{usuario.endereco.estado}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
