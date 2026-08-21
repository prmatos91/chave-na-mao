CREATE TABLE veiculo (
    id                BIGSERIAL PRIMARY KEY,
    marca             VARCHAR(100)   NOT NULL,
    modelo            VARCHAR(100)   NOT NULL,
    ano               INTEGER        NOT NULL,
    preco             NUMERIC(12, 2) NOT NULL,
    cor               VARCHAR(50)    NOT NULL,
    quilometragem     INTEGER        NOT NULL DEFAULT 0,
    status            VARCHAR(20)    NOT NULL DEFAULT 'DISPONIVEL'
                          CHECK (status IN ('DISPONIVEL', 'RESERVADO', 'VENDIDO')),
    created_at        TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_veiculo_status ON veiculo (status);
CREATE INDEX idx_veiculo_marca_modelo ON veiculo (marca, modelo);

CREATE TABLE cliente (
    id                    BIGSERIAL PRIMARY KEY,
    nome                  VARCHAR(150) NOT NULL,
    email                 VARCHAR(150) NOT NULL UNIQUE,
    telefone              VARCHAR(20)  NOT NULL,
    interesse_principal   VARCHAR(20)  NOT NULL
                              CHECK (interesse_principal IN ('SUV', 'HATCH', 'SEDAN', 'UTILITARIO', 'USADO', 'ZERO')),
    created_at            TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_cliente_nome ON cliente (nome);

CREATE TABLE oportunidade (
    id              BIGSERIAL PRIMARY KEY,
    cliente_id      BIGINT         NOT NULL REFERENCES cliente (id) ON DELETE RESTRICT,
    veiculo_id      BIGINT         NOT NULL REFERENCES veiculo (id) ON DELETE RESTRICT,
    status          VARCHAR(30)    NOT NULL DEFAULT 'NOVO_LEAD'
                        CHECK (status IN ('NOVO_LEAD', 'EM_NEGOCIACAO', 'PROPOSTA_ENVIADA', 'VENDIDO', 'PERDIDO')),
    valor_proposto  NUMERIC(12, 2),
    observacoes     TEXT,
    created_at      TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidade_status ON oportunidade (status);
CREATE INDEX idx_oportunidade_cliente ON oportunidade (cliente_id);
CREATE INDEX idx_oportunidade_veiculo ON oportunidade (veiculo_id);
