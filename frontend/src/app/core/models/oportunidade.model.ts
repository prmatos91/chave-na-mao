import { Cliente } from './cliente.model';
import { Veiculo } from './veiculo.model';

export type StatusOportunidade = 'NOVO_LEAD' | 'EM_NEGOCIACAO' | 'PROPOSTA_ENVIADA' | 'VENDIDO' | 'PERDIDO';

export interface Oportunidade {
  id: number;
  cliente: Cliente;
  veiculo: Veiculo;
  status: StatusOportunidade;
  valorProposto: number | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OportunidadeRequest {
  clienteId: number;
  veiculoId: number;
  status: StatusOportunidade;
  valorProposto: number | null;
  observacoes: string | null;
}
