-- Corrige uma inconsistencia real da massa de dados: 4 dos 5 veiculos com status
-- RESERVADO nao tinham nenhuma oportunidade vinculada, o que nao faz sentido do
-- ponto de vista de negocio (um veiculo fica reservado porque alguem esta
-- negociando por ele) e deixava a secao "Clientes interessados" da tela de
-- detalhe vazia para esses casos. RESERVADO nao e derivado automaticamente de
-- uma oportunidade (diferente de VENDIDO, que tem essa regra em
-- OportunidadeService), entao essa vinculacao precisa ser feita manualmente aqui.

INSERT INTO oportunidade (cliente_id, veiculo_id, status, valor_proposto, observacoes) VALUES
    ((SELECT id FROM cliente WHERE email = 'isabela.rocha@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Jeep' AND modelo = 'Compass' AND ano = 2023),
     'EM_NEGOCIACAO', 185000.00, 'Cliente pediu para reservar o veiculo enquanto finaliza a aprovacao do financiamento.'),
    ((SELECT id FROM cliente WHERE email = 'gabriela.cardoso@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Renault' AND modelo = 'Kwid' AND ano = 2023),
     'PROPOSTA_ENVIADA', 66500.00, 'Veiculo reservado por 48h enquanto o cliente decide entre esse e outro modelo.'),
    ((SELECT id FROM cliente WHERE email = 'karina.mendes@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Honda' AND modelo = 'City' AND ano = 2024),
     'EM_NEGOCIACAO', 128000.00, 'Reservado apos test drive, aguardando aprovacao de credito do cliente.'),
    ((SELECT id FROM cliente WHERE email = 'henrique.barbosa@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Hyundai' AND modelo = 'Tucson' AND ano = 2022),
     'PROPOSTA_ENVIADA', 183000.00, 'Proposta enviada; veiculo reservado ate o cliente confirmar a compra.');
