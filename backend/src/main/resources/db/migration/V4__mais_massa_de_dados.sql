-- Massa de dados adicional para tornar a demonstracao mais realista: mais marcas,
-- mais de um modelo por marca (mostra o autocomplete marca -> modelo em cascata
-- filtrando de verdade), paginacao com mais de uma pagina nas 3 listagens, e uma
-- distribuicao de status mais rica no dashboard. Nao altera V2__seed.sql (ja aplicada
-- em ambientes existentes) - so acrescenta.

INSERT INTO veiculo (marca, modelo, ano, preco, cor, quilometragem, status) VALUES
    ('Toyota', 'Yaris', 2023, 89900.00, 'Branco', 8000, 'DISPONIVEL'),
    ('Toyota', 'Hilux', 2022, 259900.00, 'Prata', 35000, 'DISPONIVEL'),
    ('Honda', 'Civic', 2023, 169900.00, 'Preto', 14000, 'DISPONIVEL'),
    ('Honda', 'City', 2024, 132900.00, 'Branco', 2000, 'RESERVADO'),
    ('Volkswagen', 'Nivus', 2023, 119900.00, 'Cinza', 11000, 'DISPONIVEL'),
    ('Volkswagen', 'T-Cross', 2022, 129900.00, 'Vermelho', 22000, 'VENDIDO'),
    ('Chevrolet', 'Tracker', 2023, 139900.00, 'Branco', 9000, 'DISPONIVEL'),
    ('Chevrolet', 'S10', 2021, 219900.00, 'Preto', 48000, 'DISPONIVEL'),
    ('Hyundai', 'HB20', 2023, 84900.00, 'Prata', 16000, 'DISPONIVEL'),
    ('Hyundai', 'Tucson', 2022, 189900.00, 'Cinza', 30000, 'RESERVADO'),
    ('Fiat', 'Pulse', 2023, 104900.00, 'Vermelho', 7000, 'DISPONIVEL'),
    ('Fiat', 'Argo', 2021, 74900.00, 'Branco', 40000, 'VENDIDO'),
    ('Jeep', 'Renegade', 2022, 129900.00, 'Cinza', 25000, 'DISPONIVEL'),
    ('Renault', 'Duster', 2023, 129900.00, 'Laranja', 12000, 'DISPONIVEL'),
    ('Nissan', 'Kicks', 2023, 124900.00, 'Prata', 10000, 'DISPONIVEL'),
    ('Nissan', 'Versa', 2022, 89900.00, 'Branco', 26000, 'DISPONIVEL'),
    ('Ford', 'Ka', 2020, 54900.00, 'Vermelho', 55000, 'DISPONIVEL'),
    ('Ford', 'EcoSport', 2019, 69900.00, 'Preto', 62000, 'VENDIDO'),
    ('Kia', 'Sportage', 2023, 199900.00, 'Branco', 5000, 'DISPONIVEL'),
    ('Peugeot', '208', 2022, 94900.00, 'Azul', 18000, 'RESERVADO'),
    ('Citroen', 'C4 Cactus', 2021, 89900.00, 'Cinza', 33000, 'DISPONIVEL'),
    ('Mitsubishi', 'L200', 2020, 189900.00, 'Prata', 58000, 'DISPONIVEL'),
    ('BMW', '320i', 2022, 289900.00, 'Preto', 20000, 'DISPONIVEL'),
    ('Audi', 'A3', 2021, 169900.00, 'Branco', 28000, 'DISPONIVEL');

INSERT INTO cliente (nome, email, telefone, interesse_principal) VALUES
    ('Bruno Almeida', 'bruno.almeida@example.com', '11998877665', 'SUV'),
    ('Camila Rodrigues', 'camila.rodrigues@example.com', '21987766554', 'HATCH'),
    ('Diego Martins', 'diego.martins@example.com', '31976655443', 'SEDAN'),
    ('Elaine Ferreira', 'elaine.ferreira@example.com', '41965544332', 'ZERO'),
    ('Felipe Nascimento', 'felipe.nascimento@example.com', '51954433221', 'USADO'),
    ('Gabriela Cardoso', 'gabriela.cardoso@example.com', '61943322110', 'UTILITARIO'),
    ('Henrique Barbosa', 'henrique.barbosa@example.com', '71932211009', 'SUV'),
    ('Isabela Rocha', 'isabela.rocha@example.com', '81921100998', 'SEDAN'),
    ('Joao Pedro Alves', 'joao.alves@example.com', '91910099887', 'HATCH'),
    ('Karina Mendes', 'karina.mendes@example.com', '11909988776', 'ZERO');

-- FKs resolvidas por chave natural (email / marca+modelo+ano), nao por id
-- hardcoded: mais seguro, nao depende da ordem exata de insercao ter batido com
-- o auto-increment em todo ambiente onde essa migration rodar.
INSERT INTO oportunidade (cliente_id, veiculo_id, status, valor_proposto, observacoes) VALUES
    ((SELECT id FROM cliente WHERE email = 'bruno.almeida@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Toyota' AND modelo = 'Hilux' AND ano = 2022),
     'EM_NEGOCIACAO', 255000.00, 'Negociando forma de pagamento, avaliando consorcio.'),
    ((SELECT id FROM cliente WHERE email = 'camila.rodrigues@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Volkswagen' AND modelo = 'Nivus' AND ano = 2023),
     'NOVO_LEAD', NULL, 'Cliente visitou a loja no fim de semana, ainda sem proposta.'),
    ((SELECT id FROM cliente WHERE email = 'diego.martins@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Honda' AND modelo = 'Civic' AND ano = 2023),
     'PROPOSTA_ENVIADA', 165000.00, 'Proposta enviada por e-mail, aguardando aprovacao do financiamento.'),
    ((SELECT id FROM cliente WHERE email = 'elaine.ferreira@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Kia' AND modelo = 'Sportage' AND ano = 2023),
     'NOVO_LEAD', NULL, 'Pediu mais fotos do veiculo por WhatsApp.'),
    ((SELECT id FROM cliente WHERE email = 'felipe.nascimento@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Volkswagen' AND modelo = 'T-Cross' AND ano = 2022),
     'VENDIDO', 125000.00, 'Negocio fechado com entrada e financiamento em 48x.'),
    ((SELECT id FROM cliente WHERE email = 'gabriela.cardoso@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Chevrolet' AND modelo = 'S10' AND ano = 2021),
     'EM_NEGOCIACAO', 205000.00, 'Avaliando troca com veiculo usado na entrada.'),
    ((SELECT id FROM cliente WHERE email = 'henrique.barbosa@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Fiat' AND modelo = 'Argo' AND ano = 2021),
     'VENDIDO', 72000.00, 'Pagamento a vista via PIX.'),
    ((SELECT id FROM cliente WHERE email = 'isabela.rocha@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Peugeot' AND modelo = '208' AND ano = 2022),
     'PROPOSTA_ENVIADA', 91000.00, 'Aguardando retorno sobre revisao do valor.'),
    ((SELECT id FROM cliente WHERE email = 'joao.alves@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Ford' AND modelo = 'EcoSport' AND ano = 2019),
     'VENDIDO', 65000.00, 'Cliente retirou o veiculo no mesmo dia.'),
    ((SELECT id FROM cliente WHERE email = 'karina.mendes@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Nissan' AND modelo = 'Kicks' AND ano = 2023),
     'NOVO_LEAD', NULL, 'Primeiro contato via formulario do site.'),
    ((SELECT id FROM cliente WHERE email = 'ana.souza@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'BMW' AND modelo = '320i' AND ano = 2022),
     'PERDIDO', 280000.00, 'Cliente optou por importado de outra revenda.'),
    ((SELECT id FROM cliente WHERE email = 'carlos.lima@example.com'),
     (SELECT id FROM veiculo WHERE marca = 'Hyundai' AND modelo = 'HB20' AND ano = 2023),
     'EM_NEGOCIACAO', 82000.00, 'Negociando desconto para pagamento a vista.');
