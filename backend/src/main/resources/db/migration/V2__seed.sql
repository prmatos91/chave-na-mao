INSERT INTO veiculo (marca, modelo, ano, preco, cor, quilometragem, status) VALUES
    ('Toyota', 'Corolla', 2023, 145900.00, 'Prata', 12000, 'DISPONIVEL'),
    ('Honda', 'HR-V', 2024, 168500.00, 'Branco', 5000, 'DISPONIVEL'),
    ('Volkswagen', 'Polo', 2022, 98900.00, 'Preto', 28000, 'DISPONIVEL'),
    ('Jeep', 'Compass', 2023, 189900.00, 'Cinza', 15000, 'RESERVADO'),
    ('Chevrolet', 'Onix', 2021, 79900.00, 'Vermelho', 42000, 'VENDIDO'),
    ('Hyundai', 'Creta', 2024, 154900.00, 'Branco', 3000, 'DISPONIVEL'),
    ('Fiat', 'Toro', 2022, 159900.00, 'Preto', 31000, 'DISPONIVEL'),
    ('Renault', 'Kwid', 2023, 68900.00, 'Laranja', 9000, 'RESERVADO');

INSERT INTO cliente (nome, email, telefone, interesse_principal) VALUES
    ('Ana Beatriz Souza', 'ana.souza@example.com', '11987654321', 'SUV'),
    ('Carlos Eduardo Lima', 'carlos.lima@example.com', '11976543210', 'SEDAN'),
    ('Fernanda Oliveira', 'fernanda.oliveira@example.com', '21965432109', 'HATCH'),
    ('Marcos Vinicius Costa', 'marcos.costa@example.com', '31954321098', 'ZERO'),
    ('Juliana Pereira', 'juliana.pereira@example.com', '41943210987', 'USADO'),
    ('Rafael Santos', 'rafael.santos@example.com', '51932109876', 'UTILITARIO');

INSERT INTO oportunidade (cliente_id, veiculo_id, status, valor_proposto, observacoes) VALUES
    (1, 2, 'EM_NEGOCIACAO', 165000.00, 'Cliente pediu desconto de 3500 no valor a vista.'),
    (2, 1, 'PROPOSTA_ENVIADA', 143000.00, 'Aguardando retorno do cliente sobre financiamento.'),
    (3, 3, 'NOVO_LEAD', NULL, 'Cliente chegou por indicacao, ainda sem proposta formal.'),
    (4, 6, 'NOVO_LEAD', NULL, 'Interessado em carro zero km, agendou test drive.'),
    (5, 5, 'VENDIDO', 79900.00, 'Venda concluida, pagamento a vista.'),
    (6, 7, 'PERDIDO', 155000.00, 'Cliente fechou negocio com concorrente.');
