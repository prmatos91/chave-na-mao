import { InteressePrincipal } from '../../core/models/cliente.model';
import { StatusOportunidade } from '../../core/models/oportunidade.model';
import { StatusVeiculo } from '../../core/models/veiculo.model';

export const STATUS_VEICULO_LABELS: Record<StatusVeiculo, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
};

export const STATUS_VEICULO_COLOR: Record<StatusVeiculo, string> = {
  DISPONIVEL: 'status-verde',
  RESERVADO: 'status-amarelo',
  VENDIDO: 'status-cinza',
};

export const INTERESSE_LABELS: Record<InteressePrincipal, string> = {
  SUV: 'SUV',
  HATCH: 'Hatch',
  SEDAN: 'Sedã',
  UTILITARIO: 'Utilitário',
  USADO: 'Carro usado',
  ZERO: 'Carro zero',
};

export const STATUS_OPORTUNIDADE_LABELS: Record<StatusOportunidade, string> = {
  NOVO_LEAD: 'Novo lead',
  EM_NEGOCIACAO: 'Em negociação',
  PROPOSTA_ENVIADA: 'Proposta enviada',
  VENDIDO: 'Vendido',
  PERDIDO: 'Perdido',
};

export const STATUS_OPORTUNIDADE_COLOR: Record<StatusOportunidade, string> = {
  NOVO_LEAD: 'status-azul',
  EM_NEGOCIACAO: 'status-amarelo',
  PROPOSTA_ENVIADA: 'status-roxo',
  VENDIDO: 'status-verde',
  PERDIDO: 'status-vermelho',
};

export function enumValues<T extends string>(record: Record<T, string>): T[] {
  return Object.keys(record) as T[];
}
