export type InteressePrincipal = 'SUV' | 'HATCH' | 'SEDAN' | 'UTILITARIO' | 'USADO' | 'ZERO';

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  interessePrincipal: InteressePrincipal;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteRequest {
  nome: string;
  email: string;
  telefone: string;
  interessePrincipal: InteressePrincipal;
}
