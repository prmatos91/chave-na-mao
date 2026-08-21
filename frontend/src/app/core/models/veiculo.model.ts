export type StatusVeiculo = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';

export interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  preco: number;
  cor: string;
  quilometragem: number;
  status: StatusVeiculo;
  createdAt: string;
  updatedAt: string;
}

export interface VeiculoRequest {
  marca: string;
  modelo: string;
  ano: number;
  preco: number;
  cor: string;
  quilometragem: number;
  status: StatusVeiculo;
}
