"use client";

import { EditorialHeader } from "@/app/website";
import {
  User,
  CheckCircle,
  FileText,
  CloudUpload,
  Lock,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const documents = [
  { name: "Documento de Identidade", status: "Verificado", date: "12 Jan 2026" },
  { name: "Comprovante de Residência", status: "Pendente", date: "—" },
  { name: "Certificado OAB", status: "Verificado", date: "03 Mar 2026" },
  { name: "Contrato de Representação", status: "Pendente", date: "—" },
];

const certifications = [
  { label: "ISO 27001" },
  { label: "LGPD" },
  { label: "AES-256" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
      {children}
    </label>
  );
}

function TextInput({
  type = "text",
  defaultValue,
  disabled,
  placeholder,
}: {
  type?: string;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={disabled}
      className={[
        "w-full bg-surface-container-high border-none rounded-lg p-4 text-white outline-none",
        "focus:ring-2 focus:ring-primary/40 transition-shadow",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ]
        .join(" ")
        .trim()}
    />
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface-container rounded-xl p-6 border border-white/5 ${className}`.trim()}>
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="font-headline text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DocumentRow({
  name,
  status,
  date,
}: {
  name: string;
  status: "Verificado" | "Pendente";
  date: string;
}) {
  const isVerified = status === "Verificado";
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-on-surface-variant shrink-0" />
        <span className="text-sm font-medium text-on-surface">{name}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {isVerified ? (
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Verificado
          </span>
        ) : (
          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Pendente
          </span>
        )}
        <span className="text-xs text-on-surface-variant hidden sm:block">
          {date}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PerfilPage() {
  return (
    <>
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EditorialHeader
          kicker="MEU PERFIL"
          title="Perfil."
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="border border-white/10 text-on-surface-variant hover:border-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Descartar
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          }
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ----------------------------------------------------------------- */}
        {/* Left Column — Dados Pessoais */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">
          <SectionCard title="Dados Pessoais" icon={User} className="glass-card">
            {/* Profile header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <User className="w-9 h-9 text-on-surface-variant" />
              </div>
              <div>
                <p className="font-headline text-xl font-bold text-white leading-tight">
                  Carlos Zattar
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verificado
                </span>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Nome Completo</FieldLabel>
                  <TextInput defaultValue="Carlos Zattar" />
                </div>
                <div>
                  <FieldLabel>CPF</FieldLabel>
                  <TextInput
                    defaultValue="XXX.XXX.XXX-XX"
                    disabled
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3.5 h-3.5 text-on-surface-variant" />
                  <FieldLabel>E-mail Profissional</FieldLabel>
                </div>
                <TextInput
                  type="email"
                  defaultValue="carlos.zattar@magistrate.ai"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-3.5 h-3.5 text-on-surface-variant" />
                    <FieldLabel>Telefone</FieldLabel>
                  </div>
                  <TextInput type="tel" defaultValue="+55 11 99999-9999" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-3.5 h-3.5 text-on-surface-variant" />
                    <FieldLabel>Cargo / Especialidade</FieldLabel>
                  </div>
                  <div className="relative">
                    <select className="w-full bg-surface-container-high border-none rounded-lg p-4 text-white outline-none focus:ring-2 focus:ring-primary/40 transition-shadow appearance-none">
                      <option>Advogado Sênior</option>
                      <option>Consultor Jurídico</option>
                      <option>Paralegal</option>
                      <option>Cliente</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg
                        className="w-4 h-4 text-on-surface-variant"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </SectionCard>

          {/* Security */}
          <SectionCard title="Segurança" icon={Lock}>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-3.5 h-3.5 text-on-surface-variant" />
                    <FieldLabel>Senha Atual</FieldLabel>
                  </div>
                  <TextInput type="password" placeholder="••••••••" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-3.5 h-3.5 text-on-surface-variant" />
                    <FieldLabel>Nova Senha</FieldLabel>
                  </div>
                  <TextInput type="password" placeholder="••••••••" />
                </div>
              </div>

              {/* 2FA toggle row */}
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      Autenticação de Dois Fatores
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Proteção adicional para sua conta
                    </p>
                  </div>
                </div>
                {/* Simple pill toggle */}
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary/20 transition-colors focus:outline-none"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-on-surface-variant shadow ring-0 transition-transform" />
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right Column — Cofre Digital */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-linear-to-br from-surface-container to-surface-container-high rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-headline text-xl font-bold text-white">
                Cofre Digital Criptografado
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-6">
              Documentos protegidos com criptografia AES-256. Acesso restrito
              ao titular e consultores autorizados.
            </p>

            {/* Document list */}
            <div className="mb-6">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.name}
                  name={doc.name}
                  status={doc.status as "Verificado" | "Pendente"}
                  date={doc.date}
                />
              ))}
            </div>

            {/* Upload zone */}
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex justify-center mb-3">
                <CloudUpload className="w-8 h-8 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">
                Arraste arquivos ou clique para enviar
              </p>
              <p className="text-xs text-on-surface-variant">
                PDF, DOC até 10MB
              </p>
            </div>

            {/* Security certifications */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {certifications.map((cert) => (
                <span
                  key={cert.label}
                  className="bg-surface-container-highest rounded-lg px-4 py-2 text-xs font-bold text-on-surface-variant"
                >
                  {cert.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
