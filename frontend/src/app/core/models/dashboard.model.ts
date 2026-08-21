import { StatusOportunidade } from './oportunidade.model';
import { StatusVeiculo } from './veiculo.model';

export interface DashboardResponse {
  totalVeiculos: number;
  totalClientes: number;
  totalOportunidades: number;
  veiculosPorStatus: Record<StatusVeiculo, number>;
  oportunidadesPorStatus: Record<StatusOportunidade, number>;
}
